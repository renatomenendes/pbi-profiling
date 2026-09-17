export function buildContextProfile(contextResult, viewerModel, pages) {
  const context = contextResult?.data ?? emptyContext();
  const warnings = [...(contextResult?.warnings ?? [])];

  const tableNames = new Set((viewerModel.tables ?? []).map((table) => table.name));
  const measureNames = new Set(
    (viewerModel.measures ?? []).map(
      (measure) => `${measure.table}[${measure.name}]`,
    ),
  );
  const pageNames = new Set((pages ?? []).flatMap((page) => [page.name, page.id]));
  const sourceRefs = new Set(
    (viewerModel.sources ?? []).flatMap((source) => [
      source.ref,
      [source.type, source.server, source.database, source.url, source.path]
        .filter(Boolean)
        .join('|'),
    ].filter(Boolean)),
  );

  const unmatched = {
    tables: unmatchedKeys(context.tables, tableNames),
    measures: unmatchedKeys(context.measures, measureNames),
    pages: unmatchedKeys(context.pages, pageNames),
    sources: unmatchedKeys(context.sources, sourceRefs),
  };

  for (const [kind, names] of Object.entries(unmatched)) {
    for (const name of names) {
      warnings.push(`Context annotation ${kind}.${name} does not match a PBIP object.`);
    }
  }

  const objectCoverage = {
    tables: coverage(Object.keys(context.tables ?? {}).filter((name) => tableNames.has(name)).length, tableNames.size),
    measures: coverage(Object.keys(context.measures ?? {}).filter((name) => measureNames.has(name)).length, measureNames.size),
    pages: coverage(Object.keys(context.pages ?? {}).filter((name) => pageNames.has(name)).length, (pages ?? []).length),
    sources: coverage(Object.keys(context.sources ?? {}).filter((name) => sourceRefs.has(name)).length, viewerModel.sources?.length ?? 0),
  };

  const dashboardCompleteness = dashboardCompletenessScore(context.dashboard);

  return {
    status: contextResult?.status ?? 'not-provided',
    source: contextResult?.source ?? null,
    data: context,
    coverage: {
      dashboard: dashboardCompleteness,
      objects: objectCoverage,
    },
    unmatched,
    warnings,
  };
}

function unmatchedKeys(map, known) {
  return Object.keys(map ?? {})
    .filter((name) => !known.has(name))
    .sort((left, right) => left.localeCompare(right));
}

function coverage(documented, total) {
  if (!total) {
    return null;
  }
  return Math.round((documented / total) * 1000) / 1000;
}

function dashboardCompletenessScore(dashboard = {}) {
  const checks = [
    Boolean(dashboard.purpose),
    Boolean(dashboard.audience?.length),
    Boolean(dashboard.owner?.team || dashboard.owner?.contact),
    Boolean(dashboard.operationalUse?.length),
    Boolean(dashboard.businessQuestions?.length),
    Boolean(dashboard.refresh?.cadence),
    Boolean(dashboard.refresh?.sla),
    Boolean(dashboard.caveats?.length),
  ];
  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 1000) / 1000;
}

function emptyContext() {
  return {
    schemaVersion: 1,
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
