import {
  existsSync,
  readFileSync,
} from 'node:fs';
import { basename, resolve } from 'node:path';

export const CONTEXT_SCHEMA_VERSION = 1;
export const DEFAULT_CONTEXT_FILE = 'pbi-profiling.context.json';

const TOP_LEVEL_FIELDS = new Set([
  '$schema',
  'schemaVersion',
  'dashboard',
  'tables',
  'measures',
  'pages',
  'sources',
  'notes',
]);

const DASHBOARD_FIELDS = new Set([
  'purpose',
  'audience',
  'owner',
  'operationalUse',
  'businessQuestions',
  'refresh',
  'caveats',
]);

const OWNER_FIELDS = new Set([
  'team',
  'contact',
]);

const REFRESH_FIELDS = new Set([
  'cadence',
  'sla',
  'timezone',
]);

const ENTITY_FIELDS = new Set([
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

const ARRAY_FIELDS = new Set([
  'key',
  'audience',
  'operationalUse',
  'businessQuestions',
  'caveats',
  'notes',
]);

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
  assertPlainObject(value, 'Business context');
  assertAllowedKeys(value, TOP_LEVEL_FIELDS, 'business context');

  if (value.schemaVersion !== CONTEXT_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported business context schemaVersion ${String(value.schemaVersion)}; expected ${CONTEXT_SCHEMA_VERSION}.`,
    );
  }

  const dashboard = normalizeDashboard(value.dashboard);
  const tables = normalizeEntityMap(value.tables, 'tables');
  const measures = normalizeEntityMap(value.measures, 'measures');
  const pages = normalizeEntityMap(value.pages, 'pages');
  const sources = normalizeEntityMap(value.sources, 'sources');
  const notes = normalizeStringArray(value.notes, 'notes');

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
    warnings: [],
  };
}

function normalizeDashboard(value) {
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

  assertPlainObject(value, 'dashboard');
  assertAllowedKeys(value, DASHBOARD_FIELDS, 'dashboard');

  return {
    purpose: normalizeOptionalString(value.purpose, 'dashboard.purpose'),
    audience: normalizeStringArray(value.audience, 'dashboard.audience'),
    owner: normalizeOwner(value.owner),
    operationalUse: normalizeStringArray(
      value.operationalUse,
      'dashboard.operationalUse',
    ),
    businessQuestions: normalizeStringArray(
      value.businessQuestions,
      'dashboard.businessQuestions',
    ),
    refresh: normalizeRefresh(value.refresh),
    caveats: normalizeStringArray(value.caveats, 'dashboard.caveats'),
  };
}

function normalizeOwner(value) {
  if (value == null) {
    return null;
  }

  assertPlainObject(value, 'dashboard.owner');
  assertAllowedKeys(value, OWNER_FIELDS, 'dashboard.owner');

  return {
    team: normalizeOptionalString(value.team, 'dashboard.owner.team'),
    contact: normalizeOptionalString(
      value.contact,
      'dashboard.owner.contact',
    ),
  };
}

function normalizeRefresh(value) {
  if (value == null) {
    return null;
  }

  assertPlainObject(value, 'dashboard.refresh');
  assertAllowedKeys(value, REFRESH_FIELDS, 'dashboard.refresh');

  return {
    cadence: normalizeOptionalString(
      value.cadence,
      'dashboard.refresh.cadence',
    ),
    sla: normalizeOptionalString(value.sla, 'dashboard.refresh.sla'),
    timezone: normalizeOptionalString(
      value.timezone,
      'dashboard.refresh.timezone',
    ),
  };
}

function normalizeEntityMap(value, path) {
  if (value == null) {
    return {};
  }

  assertPlainObject(value, path);

  const normalized = {};
  for (const [name, metadata] of Object.entries(value)) {
    assertPlainObject(metadata, `${path}.${name}`);
    normalized[name] = normalizeEntityMetadata(metadata, `${path}.${name}`);
  }
  return normalized;
}

function normalizeEntityMetadata(metadata, path) {
  assertAllowedKeys(metadata, ENTITY_FIELDS, path);

  const result = {};
  for (const [field, value] of Object.entries(metadata)) {
    if (ARRAY_FIELDS.has(field)) {
      result[field] = normalizeStringArray(value, `${path}.${field}`);
      continue;
    }

    if (field === 'owner') {
      result[field] = normalizeFlexibleStringObject(value, `${path}.${field}`);
      continue;
    }

    if (field === 'refresh') {
      result[field] = normalizeStringObject(value, `${path}.${field}`);
      continue;
    }

    const normalized = normalizeOptionalString(value, `${path}.${field}`);
    if (normalized !== null) {
      result[field] = normalized;
    }
  }

  return result;
}

function normalizeFlexibleStringObject(value, path) {
  if (value == null) {
    return null;
  }

  if (typeof value === 'string') {
    return value.trim() || null;
  }

  return normalizeStringObject(value, path);
}

function normalizeStringObject(value, path) {
  assertPlainObject(value, path);

  const normalized = {};
  for (const [name, item] of Object.entries(value)) {
    if (typeof item !== 'string') {
      throw new Error(`${path}.${name} must be a string.`);
    }
    const trimmed = item.trim();
    if (trimmed) {
      normalized[name] = trimmed;
    }
  }
  return normalized;
}

function normalizeOptionalString(value, path) {
  if (value == null) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new Error(`${path} must be a string.`);
  }
  return value.trim() || null;
}

function normalizeStringArray(value, path) {
  if (value == null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array of strings.`);
  }

  const strings = value.map((item, index) => {
    if (typeof item !== 'string') {
      throw new Error(`${path}[${index}] must be a string.`);
    }
    return item.trim();
  }).filter(Boolean);

  return [...new Set(strings)];
}

function assertPlainObject(value, path) {
  if (!isPlainObject(value)) {
    throw new Error(`${path} must be a JSON object.`);
  }
}

function assertAllowedKeys(value, allowed, path) {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    throw new Error(
      `${path} contains unsupported field(s): ${unknown.sort().join(', ')}.`,
    );
  }
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
