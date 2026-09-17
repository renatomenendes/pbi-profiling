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
    describeColumnResolution(
      column,
      tableByName.get(column.table),
      tableByName,
    ),
  );

  const physicalColumn = columns.filter(
    (item) => item.level === 'physical-column',
  ).length;
  const resource = columns.filter((item) => item.level === 'resource').length;
  const inline = columns.filter((item) => item.level === 'inline').length;
  const computed = columns.filter((item) => item.level === 'computed').length;
  const modelDefined = columns.filter(
    (item) => item.level === 'model-defined',
  ).length;
  const unresolved = columns.filter(
    (item) => item.level === 'unresolved',
  ).length;

  // External-source coverage intentionally excludes inline/model-local values.
  // Inline literals are already fully explained by the model itself and do not have an
  // external source object to resolve. Mixing them into the denominator would make a
  // perfectly explained local lookup look like a source-lineage failure.
  const traceable = physicalColumn + resource + unresolved;

  const externalResourceTables = tables.filter(
    (item) => item.scope === 'external' && item.level !== 'unresolved',
  ).length;
  const inlineTables = tables.filter((item) => item.scope === 'inline').length;
  const physicalTableTables = tables.filter(
    (item) => item.level === 'physical-table',
  ).length;
  const resourceTables = tables.filter(
    (item) => item.level === 'resource',
  ).length;
  const unresolvedTables = tables.filter(
    (item) => item.level === 'unresolved',
  ).length;

  return {
    methodology: {
      physicalColumnCoverage:
        'Strict external-source coverage: columns traced to an addressable physical table/column divided by columns that require external source lineage.',
      resourceLineageCoverage:
        'Resource-aware external-source coverage: columns traced at least to a physical external resource (URL, file, service or addressable table) divided by columns that require external source lineage.',
      inlinePolicy:
        'Inline/model-local columns are reported separately and excluded from external-source coverage because their values are embedded in the PBIP/Power Query model rather than read from an external physical source.',
      caveat:
        'Resource-level lineage is intentionally weaker than physical table/column lineage. It must not be presented as an exact source-column mapping.',
    },
    summary: {
      totalColumns: columns.length,
      traceableColumns: traceable,
      physicalColumnResolved: physicalColumn,
      resourceResolved: resource,
      inlineColumns: inline,
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

function describeColumnResolution(column, tableResolution, tableByName) {
  if (
    column.origin === 'source' &&
    (column.physicalPath || column.physical?.column)
  ) {
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

  const inheritedSource = joinedSourceResolution(column, tableByName);

  if (isInlineColumn(column, tableResolution, inheritedSource)) {
    return baseColumn(
      column,
      'inline',
      inheritedSource?.scope === 'inline' ? inheritedSource : tableResolution,
    );
  }

  if (isResourceOnlyColumn(column, tableResolution, inheritedSource)) {
    return baseColumn(
      column,
      'resource',
      inheritedSource?.scope === 'external' ? inheritedSource : tableResolution,
    );
  }

  return baseColumn(column, 'unresolved', tableResolution);
}

function isInlineColumn(column, tableResolution, inheritedSource) {
  if (!isUnresolvedSourceColumn(column)) {
    return false;
  }

  if (tableResolution?.scope === 'inline') {
    return true;
  }

  return inheritedSource?.scope === 'inline';
}

function isResourceOnlyColumn(column, tableResolution, inheritedSource) {
  if (!isUnresolvedSourceColumn(column)) {
    return false;
  }

  if (
    inheritedSource?.scope === 'external' &&
    inheritedSource.level !== 'unresolved'
  ) {
    return true;
  }

  if (
    tableResolution?.scope !== 'external' ||
    tableResolution.level !== 'resource'
  ) {
    return false;
  }

  return String(column.reason ?? '').startsWith(
    'No physical table could be resolved from the Power Query expression.',
  );
}

function isUnresolvedSourceColumn(column) {
  return (
    column.origin === 'unresolved' &&
    column.sourceless === 'unresolved'
  );
}

function joinedSourceResolution(column, tableByName) {
  const reason = String(column.reason ?? '');
  const match = /\sfrom\s(.+), whose physical table could not be resolved\.$/i.exec(
    reason,
  );

  if (!match) {
    return null;
  }

  const candidate = normalizeReferenceName(match[1]);
  return tableByName.get(candidate) ?? null;
}

function normalizeReferenceName(value) {
  const text = String(value ?? '').trim();

  if (text.startsWith('#"') && text.endsWith('"')) {
    return text.slice(2, -1).replaceAll('""', '"');
  }

  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text.slice(1, -1);
  }

  return text;
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
    tableResolutionScope: tableResolution?.scope ?? 'unknown',
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
