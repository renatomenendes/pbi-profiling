import {
  existsSync,
  readFileSync,
} from 'node:fs';
import { basename, resolve } from 'node:path';

export const CONFIG_SCHEMA_VERSION = 1;
export const DEFAULT_CONFIG_FILE = 'pbi-profiling.config.json';

const TOP_LEVEL_FIELDS = new Set([
  '$schema',
  'schemaVersion',
  'analysis',
]);

const ANALYSIS_FIELDS = new Set([
  'semanticHints',
]);

const SEMANTIC_HINT_FIELDS = new Set([
  'mode',
  'terms',
  'columns',
]);

const SEMANTIC_CATEGORIES = new Set([
  'temporal',
  'state',
  'duration',
  'entity',
  'freshness',
]);

export function loadProfilingConfig(targetPath, explicitPath = null) {
  const target = resolve(targetPath);
  const candidate = explicitPath
    ? resolve(explicitPath)
    : resolve(target, DEFAULT_CONFIG_FILE);

  if (!existsSync(candidate)) {
    if (explicitPath) {
      throw new Error(`Profiling config file does not exist: ${explicitPath}`);
    }

    return {
      status: 'not-provided',
      source: null,
      data: emptyConfig(),
      warnings: [],
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(candidate, 'utf-8'));
  } catch (error) {
    throw new Error(
      `Invalid JSON in profiling config ${candidate}: ${error.message}`,
    );
  }

  const normalized = validateAndNormalizeProfilingConfig(parsed);

  return {
    status: 'provided',
    source: basename(candidate),
    data: normalized.data,
    warnings: normalized.warnings,
  };
}

export function validateAndNormalizeProfilingConfig(value) {
  assertPlainObject(value, 'Profiling config');
  assertAllowedKeys(value, TOP_LEVEL_FIELDS, 'profiling config');

  if (value.schemaVersion !== CONFIG_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported profiling config schemaVersion ${String(value.schemaVersion)}; expected ${CONFIG_SCHEMA_VERSION}.`,
    );
  }

  const analysis = normalizeAnalysis(value.analysis);

  return {
    data: {
      schemaVersion: CONFIG_SCHEMA_VERSION,
      analysis,
    },
    warnings: [],
  };
}

function normalizeAnalysis(value) {
  if (value == null) {
    return emptyConfig().analysis;
  }

  assertPlainObject(value, 'analysis');
  assertAllowedKeys(value, ANALYSIS_FIELDS, 'analysis');

  return {
    semanticHints: normalizeSemanticHints(value.semanticHints),
  };
}

function normalizeSemanticHints(value) {
  if (value == null) {
    return emptySemanticHints();
  }

  assertPlainObject(value, 'analysis.semanticHints');
  assertAllowedKeys(
    value,
    SEMANTIC_HINT_FIELDS,
    'analysis.semanticHints',
  );

  const mode = value.mode ?? 'extend';
  if (!['extend', 'replace'].includes(mode)) {
    throw new Error(
      'analysis.semanticHints.mode must be either "extend" or "replace".',
    );
  }

  return {
    mode,
    terms: normalizeTerms(value.terms),
    columns: normalizeColumnHints(value.columns),
  };
}

function normalizeTerms(value) {
  const result = emptyTerms();
  if (value == null) {
    return result;
  }

  assertPlainObject(value, 'analysis.semanticHints.terms');
  assertAllowedKeys(
    value,
    SEMANTIC_CATEGORIES,
    'analysis.semanticHints.terms',
  );

  for (const category of SEMANTIC_CATEGORIES) {
    result[category] = normalizeStringArray(
      value[category],
      `analysis.semanticHints.terms.${category}`,
    );
  }

  return result;
}

function normalizeColumnHints(value) {
  if (value == null) {
    return {};
  }

  assertPlainObject(value, 'analysis.semanticHints.columns');
  const result = {};

  for (const [reference, categories] of Object.entries(value)) {
    if (!/^[^\[\]]+\[[^\[\]]+\]$/.test(reference)) {
      throw new Error(
        `Invalid column hint reference ${reference}; expected Table[Column].`,
      );
    }

    const normalized = normalizeStringArray(
      categories,
      `analysis.semanticHints.columns.${reference}`,
    );

    for (const category of normalized) {
      if (!SEMANTIC_CATEGORIES.has(category)) {
        throw new Error(
          `Unsupported semantic category ${category} in ${reference}.`,
        );
      }
    }

    result[reference] = [...new Set(normalized)].sort();
  }

  return result;
}

function emptyConfig() {
  return {
    schemaVersion: CONFIG_SCHEMA_VERSION,
    analysis: {
      semanticHints: emptySemanticHints(),
    },
  };
}

function emptySemanticHints() {
  return {
    mode: 'extend',
    terms: emptyTerms(),
    columns: {},
  };
}

function emptyTerms() {
  return Object.fromEntries(
    [...SEMANTIC_CATEGORIES].map((category) => [category, []]),
  );
}

function normalizeStringArray(value, path) {
  if (value == null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array of strings.`);
  }

  return value.map((item, index) => {
    if (typeof item !== 'string' || !item.trim()) {
      throw new Error(`${path}[${index}] must be a non-empty string.`);
    }
    return item.trim();
  });
}

function assertAllowedKeys(value, allowed, path) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`Unsupported field ${path}.${key}.`);
    }
  }
}

function assertPlainObject(value, path) {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    throw new Error(`${path} must be an object.`);
  }
}
