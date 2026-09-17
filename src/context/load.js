import {
  existsSync,
  readFileSync,
} from 'node:fs';
import { basename, resolve } from 'node:path';

export const CONTEXT_SCHEMA_VERSION = 1;
export const DEFAULT_CONTEXT_FILE = 'pbi-profiling.context.json';

export function loadBusinessContext(targetPath, explicitPath = null) {
  const target = resolve(targetPath);
  const candidate = explicitPath
    ? resolve(explicitPath)
    : resolve(target, DEFAULT_CONTEXT_FILE);

  if (!existsSync(candidate)) {
    if (explicitPath) {
      throw new Error(`Context file does not exist: ${explicitPath}`);
    }

    return {
      status: 'not-provided',
      source: null,
      data: emptyContext(),
      warnings: [],
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(candidate, 'utf-8'));
  } catch (error) {
    throw new Error(
      `Invalid JSON in context file ${candidate}: ${error.message}`,
    );
  }

  const normalized = validateAndNormalizeContext(parsed);

  return {
    status: 'provided',
    source: basename(candidate),
    data: normalized.data,
    warnings: normalized.warnings,
  };
}

export function validateAndNormalizeContext(value) {
  if (!isPlainObject(value)) {
    throw new Error('Business context must be a JSON object.');
  }

  if (value.schemaVersion !== CONTEXT_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported business context schemaVersion ${String(value.schemaVersion)}; expected ${CONTEXT_SCHEMA_VERSION}.`,
    );
  }

  const warnings = [];
  const dashboard = normalizeDashboard(value.dashboard, warnings);
  const tables = normalizeEntityMap(value.tables, 'tables', warnings);
  const measures = normalizeEntityMap(value.measures, 'measures', warnings);
  const pages = normalizeEntityMap(value.pages, 'pages', warnings);
  const sources = normalizeEntityMap(value.sources, 'sources', warnings);
  const notes = normalizeStringArray(value.notes, 'notes', warnings);

  return {
    data: {
      schemaVersion: CONTEXT_SCHEMA_VERSION,
      dashboard,
      tables,
      measures,
      pages,
      sources,
      notes,
    },
    warnings,
  };
}

function normalizeDashboard(value, warnings) {
  if (value == null) {
    return {
      purpose: null,
      audience: [],
      owner: null,
      operationalUse: [],
      businessQuestions: [],
      refresh: null,
      caveats: [],
    };
  }

  if (!isPlainObject(value)) {
    throw new Error('dashboard must be a JSON object when provided.');
  }

  const owner = normalizeOwner(value.owner, warnings);
  const refresh = normalizeRefresh(value.refresh, warnings);

  return {
    purpose: normalizeOptionalString(value.purpose, 'dashboard.purpose', warnings),
    audience: normalizeStringArray(value.audience, 'dashboard.audience', warnings),
    owner,
    operationalUse: normalizeStringArray(
      value.operationalUse,
      'dashboard.operationalUse',
      warnings,
    ),
    businessQuestions: normalizeStringArray(
      value.businessQuestions,
      'dashboard.businessQuestions',
      warnings,
    ),
    refresh,
    caveats: normalizeStringArray(value.caveats, 'dashboard.caveats', warnings),
  };
}

function normalizeOwner(value, warnings) {
  if (value == null) {
    return null;
  }
  if (!isPlainObject(value)) {
    throw new Error('dashboard.owner must be an object when provided.');
  }

  return {
    team: normalizeOptionalString(value.team, 'dashboard.owner.team', warnings),
    contact: normalizeOptionalString(
      value.contact,
      'dashboard.owner.contact',
      warnings,
    ),
  };
}

function normalizeRefresh(value, warnings) {
  if (value == null) {
    return null;
  }
  if (!isPlainObject(value)) {
    throw new Error('dashboard.refresh must be an object when provided.');
  }

  return {
    cadence: normalizeOptionalString(
      value.cadence,
      'dashboard.refresh.cadence',
      warnings,
    ),
    sla: normalizeOptionalString(value.sla, 'dashboard.refresh.sla', warnings),
    timezone: normalizeOptionalString(
      value.timezone,
      'dashboard.refresh.timezone',
      warnings,
    ),
  };
}

function normalizeEntityMap(value, path, warnings) {
  if (value == null) {
    return {};
  }
  if (!isPlainObject(value)) {
    throw new Error(`${path} must be an object keyed by PBIP object name.`);
  }

  const normalized = {};
  for (const [name, metadata] of Object.entries(value)) {
    if (!isPlainObject(metadata)) {
      throw new Error(`${path}.${name} must be an object.`);
    }

    normalized[name] = normalizeFreeformMetadata(metadata, `${path}.${name}`, warnings);
  }
  return normalized;
}

function normalizeFreeformMetadata(metadata, path, warnings) {
  const allowed = new Set([
    'businessMeaning',
    'businessDefinition',
    'purpose',
    'grain',
    'key',
    'owner',
    'criticality',
    'audience',
    'operationalUse',
    'businessQuestions',
    'refresh',
    'sla',
    'caveats',
    'notes',
  ]);

  const result = {};
  for (const [field, value] of Object.entries(metadata)) {
    if (!allowed.has(field)) {
      warnings.push(`${path}.${field} is not a recognized context field and was ignored.`);
      continue;
    }

    if (['key', 'audience', 'operationalUse', 'businessQuestions', 'caveats', 'notes'].includes(field)) {
      result[field] = normalizeStringArray(value, `${path}.${field}`, warnings);
      continue;
    }

    if (field === 'owner') {
      if (typeof value === 'string') {
        result[field] = value.trim() || null;
      } else if (isPlainObject(value)) {
        result[field] = Object.fromEntries(
          Object.entries(value)
            .filter(([, item]) => typeof item === 'string' && item.trim())
            .map(([name, item]) => [name, item.trim()]),
        );
      } else if (value != null) {
        warnings.push(`${path}.${field} was ignored because it is not a string/object.`);
      }
      continue;
    }

    if (field === 'refresh' && isPlainObject(value)) {
      result[field] = Object.fromEntries(
        Object.entries(value)
          .filter(([, item]) => typeof item === 'string' && item.trim())
          .map(([name, item]) => [name, item.trim()]),
      );
      continue;
    }

    const normalized = normalizeOptionalString(value, `${path}.${field}`, warnings);
    if (normalized !== null) {
      result[field] = normalized;
    }
  }

  return result;
}

function normalizeOptionalString(value, path, warnings) {
  if (value == null) {
    return null;
  }
  if (typeof value !== 'string') {
    warnings.push(`${path} was ignored because it is not a string.`);
    return null;
  }
  return value.trim() || null;
}

function normalizeStringArray(value, path, warnings) {
  if (value == null) {
    return [];
  }

  if (!Array.isArray(value)) {
    warnings.push(`${path} was ignored because it is not an array.`);
    return [];
  }

  const strings = [];
  value.forEach((item, index) => {
    if (typeof item !== 'string') {
      warnings.push(`${path}[${index}] was ignored because it is not a string.`);
      return;
    }
    const normalized = item.trim();
    if (normalized) {
      strings.push(normalized);
    }
  });

  return [...new Set(strings)];
}

function emptyContext() {
  return {
    schemaVersion: CONTEXT_SCHEMA_VERSION,
    dashboard: {
      purpose: null,
      audience: [],
      owner: null,
      operationalUse: [],
      businessQuestions: [],
      refresh: null,
      caveats: [],
    },
    tables: {},
    measures: {},
    pages: {},
    sources: {},
    notes: [],
  };
}

function isPlainObject(value) {
  return Boolean(value) &&
    typeof value === 'object' &&
    !Array.isArray(value);
}
