const COMPUTED_ORIGINS = new Set([
  'computed-dax',
  'computed-pq',
  'model-defined',
]);

export function buildSourceResolutionProfile(viewerModel) {
  const tables = (viewerModel.tables ?? []).map((table) =>
    describeTableResolution(table),
  );
  const tableByName = new Map(tables.map((table) => [table.table, table]));

  const columns = (viewerModel.columns ?? []).map((column) =>
    describeColumnResolution(column, tableByName.get(column.table)),
  );

  const physicalColumn = columns.filter((item) => item.level === 'physical-column').length;
  const resource = columns.filter((item) => item.level === 'resource').length;
  const computed = columns.filter((item) => item.level === 'computed').length;
  const modelDefined = columns.filter((item) => item.level === 'model-defined').length;
  const unresolved = columns.filter((item) => item.level === 'unresolved').length;
  const traceable = physicalColumn + resource + unresolved;

  const externalResourceTables = tables.filter(
    (item) => item.scope === 'external' && item.level !== 'unresolved',
  ).length;
  const inlineTables = tables.filter((item) => item.scope === 'inline').length;
  const physicalTableTables = tables.filter((item) => item.level === 'physical-table').length;
  const resourceTables = tables.filter((item) => item.level === 'resource').length;
  const unresolvedTables = tables.filter((item) => item.level === 'unresolved').length;

  return {
    methodology: {
      physicalColumnCoverage:
        'Strict coverage: columns traced to an addressable physical table/column divided by columns that require source lineage.',
      resourceLineageCoverage:
        'Resource-aware coverage: columns traced at least to a physical resource (URL, file, service or addressable table) divided by columns that require source lineage.',
      caveat:
        'Resource-level lineage is intentionally weaker than physical table/column lineage. It must not be presented as an exact source-column mapping.',
    },
    summary: {
      totalColumns: columns.length,
      traceableColumns: traceable,
      physicalColumnResolved: physicalColumn,
      resourceResolved: resource,
      computedColumns: computed,
      modelDefinedColumns: modelDefined,
      unresolvedColumns: unresolved,
      physicalColumnCoverage: ratio(physicalColumn, traceable),
      resourceLineageCoverage: ratio(physicalColumn + resource, traceable),
      totalTables: tables.length,
      externalResourceTables,
      inlineTables,
      physicalTableTables,
      resourceTables,
      unresolvedTables,
    },
    tables,
    columns,
  };
}

function describeTableResolution(table) {
  const physical = normalizePhysical(table.physical);
  const locatorKinds = [];

  if (physical.table) locatorKinds.push('table');
  if (physical.url) locatorKinds.push('url');
  if (physical.path) locatorKinds.push('path');
  if (physical.server) locatorKinds.push('server');
  if (physical.database) locatorKinds.push('database');

  const isInline = physical.system === 'Inline Literal';
  const hasExternalResource =
    !isInline &&
    Boolean(
      physical.system ||
      physical.url ||
      physical.path ||
      physical.server ||
      physical.database,
    );

  let level = 'unresolved';
  let scope = 'unknown';

  if (isInline) {
    level = 'resource';
    scope = 'inline';
  } else if (physical.table) {
    level = 'physical-table';
    scope = 'external';
  } else if (hasExternalResource) {
    level = 'resource';
    scope = 'external';
  }

  return {
    table: table.name,
    system: physical.system,
    level,
    scope,
    locatorKinds,
    hasPhysicalTable: Boolean(physical.table),
    hasResourceLocator: locatorKinds.length > 0 || Boolean(physical.system),
  };
}

function describeColumnResolution(column, tableResolution) {
  if (column.origin === 'source' && (column.physicalPath || column.physical?.column)) {
    return baseColumn(column, 'physical-column', tableResolution);
  }

  if (COMPUTED_ORIGINS.has(column.origin)) {
    return baseColumn(
      column,
      column.origin === 'model-defined' ? 'model-defined' : 'computed',
      tableResolution,
    );
  }

  if (
    column.sourceless &&
    column.sourceless !== 'unresolved' &&
    column.origin !== 'unresolved'
  ) {
    return baseColumn(column, 'computed', tableResolution);
  }

  if (isResourceOnlyColumn(column, tableResolution)) {
    return baseColumn(column, 'resource', tableResolution);
  }

  return baseColumn(column, 'unresolved', tableResolution);
}

function isResourceOnlyColumn(column, tableResolution) {
  if (!tableResolution || tableResolution.scope !== 'external') {
    return false;
  }

  if (tableResolution.level !== 'resource') {
    return false;
  }

  if (column.origin !== 'unresolved' || column.sourceless !== 'unresolved') {
    return false;
  }

  return String(column.reason ?? '').startsWith(
    'No physical table could be resolved from the Power Query expression.',
  );
}

function baseColumn(column, level, tableResolution) {
  return {
    table: column.table,
    column: column.name,
    level,
    origin: column.origin ?? null,
    confidence: column.confidence ?? null,
    sourceless: column.sourceless ?? null,
    system: tableResolution?.system ?? null,
    tableResolutionLevel: tableResolution?.level ?? 'unresolved',
    reason: column.reason ?? null,
  };
}

function normalizePhysical(physical) {
  if (!physical || typeof physical !== 'object') {
    return {
      system: null,
      server: null,
      database: null,
      table: null,
      url: null,
      path: null,
    };
  }

  return {
    system: physical.system ?? null,
    server: physical.server ?? null,
    database: physical.database ?? null,
    table: physical.table ?? null,
    url: physical.url ?? null,
    path: physical.path ?? null,
  };
}

function ratio(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : null;
}
