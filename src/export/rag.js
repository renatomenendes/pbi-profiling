/*
 * RAG export is conceptually informed by pbi-semantic-doc's MIT rag_generator.py:
 * one semantically self-contained chunk per logical entity, with dependencies
 * pre-resolved so downstream retrieval does not need to re-parse DAX.
 *
 * Reference evaluated:
 * https://github.com/ViciusLio/pbi-semantic-doc
 * commit 3e653828e4957ba7fb698ad92b1ff8bf4f791182
 */

export function buildRagChunks(profile) {
  const chunks = [];

  chunks.push(overviewChunk(profile));

  for (const page of profile.report.pages ?? []) {
    chunks.push(pageChunk(profile, page));
  }

  for (const table of profile.semanticModel.tables ?? []) {
    chunks.push(tableChunk(profile, table));
  }

  for (const measure of profile.semanticModel.measures ?? []) {
    chunks.push(measureChunk(profile, measure));
  }

  for (const source of profile.semanticModel.sources ?? []) {
    chunks.push(sourceChunk(profile, source));
  }

  for (const relationship of profile.semanticModel.relationships ?? []) {
    chunks.push(relationshipChunk(profile, relationship));
  }

  for (const finding of profile.health.findings ?? []) {
    chunks.push(findingChunk(profile, finding));
  }

  for (const opportunity of profile.analytical?.opportunities ?? []) {
    chunks.push(opportunityChunk(profile, opportunity));
  }

  if (profile.context?.status === 'provided') {
    chunks.push(contextChunk(profile));
  }

  return chunks;
}

export function renderRagJsonl(profile) {
  return `${buildRagChunks(profile)
    .map((chunk) => JSON.stringify(chunk))
    .join('\n')}\n`;
}

function overviewChunk(profile) {
  const counts = profile.overview.counts;
  const topMeasures = (profile.importance?.mostCentralMeasures ?? [])
    .slice(0, 8)
    .map((item) => `${item.table}[${item.name}]`);
  const topTables = (profile.importance?.mostCentralTables ?? [])
    .slice(0, 8)
    .map((item) => item.table);

  return chunk(
    `overview::${profile.meta.projectName}`,
    'overview',
    [
      `Power BI project: ${profile.meta.projectName}`,
      `Semantic model: ${profile.meta.modelName ?? 'not identified'}`,
      `Report: ${profile.meta.reportName ?? 'not identified'}`,
      `Structure: ${counts.pages} pages, ${counts.visuals} visuals, ${counts.tables} tables, ${counts.columns} columns, ${counts.measures} measures, ${counts.relationships} relationships, ${counts.sources} sources.`,
      `Source-lineage coverage: ${formatPercent(profile.health.sourceResolutionCoverage)}.`,
      `Combined structural complexity indicator: ${formatScore(profile.complexity?.combined?.score)} (${profile.complexity?.combined?.band ?? 'unknown'}).`,
      topMeasures.length ? `Most structurally central measures: ${topMeasures.join(', ')}.` : null,
      topTables.length ? `Most structurally central tables: ${topTables.join(', ')}.` : null,
      profile.context?.data?.dashboard?.purpose
        ? `Business purpose: ${profile.context.data.dashboard.purpose}`
        : 'Business purpose was not supplied in the optional context sidecar.',
    ],
    {
      project: profile.meta.projectName,
      model: profile.meta.modelName,
      report: profile.meta.reportName,
      counts,
      health: profile.health.counts,
      complexity: profile.complexity?.combined ?? null,
      context_status: profile.context?.status ?? 'not-provided',
    },
  );
}

function pageChunk(profile, page) {
  const visuals = (profile.report.visuals ?? []).filter(
    (visual) => visual.page === page.id,
  );
  const fields = visuals.flatMap((visual) => visual.fields ?? []);
  const measures = unique(
    fields
      .filter((field) => field.kind === 'measure' && field.table && field.name)
      .map((field) => `${field.table}[${field.name}]`),
  );
  const tables = unique(fields.map((field) => field.table).filter(Boolean));
  const context = resolvePageContext(profile, page);

  return chunk(
    `page::${profile.meta.reportName ?? 'report'}::${page.id}`,
    'report_page',
    [
      `Report page: ${page.name}`,
      `Visibility: ${page.isHidden ? 'hidden' : 'visible'}.`,
      `Visual count: ${visuals.length}.`,
      measures.length ? `Measures used: ${measures.join(', ')}.` : null,
      tables.length ? `Tables represented: ${tables.join(', ')}.` : null,
      context?.purpose ? `Documented purpose: ${context.purpose}` : null,
    ],
    {
      report: profile.meta.reportName,
      page_id: page.id,
      page_name: page.name,
      is_hidden: Boolean(page.isHidden),
      visual_count: visuals.length,
      measures,
      tables,
      business_context: context ?? null,
    },
  );
}

function tableChunk(profile, table) {
  const columns = (profile.semanticModel.columns ?? []).filter(
    (column) => column.table === table.name,
  );
  const measures = (profile.semanticModel.measures ?? []).filter(
    (measure) => measure.table === table.name,
  );
  const usage = (profile.usage.tables ?? []).find(
    (item) => item.table === table.name,
  );
  const importance = (profile.importance?.tables ?? []).find(
    (item) => item.table === table.name,
  );
  const analyticalSignals = collectTableSignals(profile, table.name);
  const context = profile.context?.data?.tables?.[table.name] ?? null;

  return chunk(
    `table::${table.name}`,
    'table',
    [
      `Table: ${table.name}`,
      `Kind: ${table.kind ?? 'table'}. Columns: ${columns.length}. Measures: ${measures.length}.`,
      table.physicalPath || table.physical
        ? `Resolved physical origin: ${table.physicalPath || table.physical}.`
        : 'No direct physical origin is exposed at table level.',
      usage
        ? `Observed report usage: ${usage.visualReferences} visuals across ${usage.pageReferences} pages.`
        : null,
      importance
        ? `Structural centrality indicator: ${formatScore(importance.score)} (${importance.band}).`
        : null,
      analyticalSignals.length
        ? `Analytical signals: ${analyticalSignals.join(', ')}.`
        : null,
      context?.grain ? `Documented grain: ${context.grain}` : null,
      context?.businessMeaning ? `Business meaning: ${context.businessMeaning}` : null,
    ],
    {
      name: table.name,
      kind: table.kind ?? 'table',
      is_hidden: Boolean(table.isHidden),
      is_calculated: Boolean(table.isCalculated),
      column_count: columns.length,
      measure_count: measures.length,
      physical_path: table.physicalPath ?? null,
      usage: usage ?? null,
      structural_importance: importance ?? null,
      analytical_signals: analyticalSignals,
      business_context: context,
    },
  );
}

function measureChunk(profile, measure) {
  const usage = (profile.usage.measures ?? []).find(
    (item) => item.table === measure.table && item.name === measure.name,
  );
  const importance = (profile.importance?.measures ?? []).find(
    (item) => item.table === measure.table && item.name === measure.name,
  );
  const complexity = (profile.complexity?.measures ?? []).find(
    (item) => item.table === measure.table && item.name === measure.name,
  );
  const contextKey = `${measure.table}[${measure.name}]`;
  const context = profile.context?.data?.measures?.[contextKey] ?? null;

  return chunk(
    `measure::${measure.table}::${measure.name}`,
    'measure',
    [
      `Measure: ${measure.name}`,
      `Table: ${measure.table}`,
      measure.description ? `Description: ${measure.description}` : null,
      measure.formatString ? `Format string: ${measure.formatString}` : null,
      measure.expression ? `DAX formula:\n${measure.expression}` : null,
      measure.dependsOn?.measures?.length
        ? `Depends on measures: ${measure.dependsOn.measures.join(', ')}.`
        : null,
      measure.dependsOn?.columns?.length
        ? `Depends on columns: ${measure.dependsOn.columns.join(', ')}.`
        : null,
      usage
        ? `Observed usage: ${usage.visualReferences} visuals, ${usage.pageReferences} pages, referenced by ${usage.referencedByMeasures} measures.`
        : null,
      importance
        ? `Structural centrality indicator: ${formatScore(importance.score)} (${importance.band}).`
        : null,
      complexity
        ? `DAX complexity indicator: ${formatScore(complexity.score)} (${complexity.band}).`
        : null,
      context?.businessDefinition
        ? `Business definition: ${context.businessDefinition}`
        : null,
    ],
    {
      name: measure.name,
      table: measure.table,
      is_hidden: Boolean(measure.isHidden),
      format_string: measure.formatString ?? null,
      depends_on: measure.dependsOn ?? {},
      usage: usage ?? null,
      structural_importance: importance ?? null,
      complexity: complexity ?? null,
      business_context: context,
    },
  );
}

function sourceChunk(profile, source) {
  const identifier = source.ref ?? [
    source.type,
    source.server,
    source.database,
    source.url,
    source.path,
  ].filter(Boolean).join('|');
  const context = profile.context?.data?.sources?.[identifier] ?? null;

  return chunk(
    `source::${identifier || 'unknown'}`,
    'source',
    [
      `Data source type: ${source.type ?? 'unknown'}.`,
      source.server ? `Server: ${source.server}.` : null,
      source.database ? `Database: ${source.database}.` : null,
      source.url ? `URL: ${source.url}.` : null,
      source.path ? `Path: ${source.path}.` : null,
      source.gatewayRequired === true ? 'Gateway required.' : null,
      source.parameterized ? 'Connection is parameterized.' : null,
      source.isNativeQuery ? 'Uses a native query.' : null,
      context?.businessMeaning ? `Business meaning: ${context.businessMeaning}` : null,
    ],
    {
      ref: source.ref ?? null,
      type: source.type ?? null,
      server: source.server ?? null,
      database: source.database ?? null,
      url: source.url ?? null,
      path: source.path ?? null,
      gateway_required: source.gatewayRequired ?? null,
      parameterized: Boolean(source.parameterized),
      native_query: Boolean(source.isNativeQuery),
      business_context: context,
    },
  );
}

function relationshipChunk(profile, relationship) {
  const id = `${relationship.fromTable}.${relationship.fromColumn}::${relationship.toTable}.${relationship.toColumn}`;
  return chunk(
    `relationship::${id}`,
    'relationship',
    [
      `Relationship: ${relationship.fromTable}[${relationship.fromColumn}] → ${relationship.toTable}[${relationship.toColumn}].`,
      `Status: ${relationship.isActive === false ? 'inactive' : 'active'}.`,
      relationship.crossFilter
        ? `Cross-filter direction: ${relationship.crossFilter}.`
        : null,
    ],
    {
      ...relationship,
    },
  );
}

function findingChunk(profile, finding) {
  return chunk(
    `finding::${finding.code}`,
    'health_finding',
    [
      `Health finding: ${finding.title ?? finding.code}`,
      `Severity: ${finding.severity}. Occurrences: ${finding.count ?? finding.evidence?.length ?? 0}.`,
      finding.evidence?.length
        ? `Evidence: ${JSON.stringify(finding.evidence)}`
        : null,
    ],
    {
      code: finding.code,
      severity: finding.severity,
      count: finding.count ?? finding.evidence?.length ?? 0,
      evidence: finding.evidence ?? [],
      project: profile.meta.projectName,
    },
  );
}

function opportunityChunk(profile, opportunity) {
  return chunk(
    `opportunity::${opportunity.id}`,
    'analytical_opportunity',
    [
      `Analytical opportunity: ${opportunity.title}`,
      `Status: ${opportunity.status}. Structural strength: ${formatScore(opportunity.strength)}. Confidence: ${opportunity.confidence}.`,
      opportunity.evidence?.length
        ? `Structural evidence: ${opportunity.evidence.join(', ')}.`
        : 'No supporting structural evidence was observed.',
      opportunity.prerequisites?.length
        ? `Validation prerequisites: ${opportunity.prerequisites.join(' | ')}.`
        : null,
      opportunity.caveat,
    ],
    {
      id: opportunity.id,
      status: opportunity.status,
      strength: opportunity.strength,
      confidence: opportunity.confidence,
      evidence: opportunity.evidence,
      prerequisites: opportunity.prerequisites,
    },
  );
}

function contextChunk(profile) {
  const dashboard = profile.context.data.dashboard;
  return chunk(
    `business-context::${profile.meta.projectName}`,
    'business_context',
    [
      `Business context for ${profile.meta.projectName}.`,
      dashboard.purpose ? `Purpose: ${dashboard.purpose}` : null,
      dashboard.audience?.length
        ? `Audience: ${dashboard.audience.join(', ')}.`
        : null,
      dashboard.operationalUse?.length
        ? `Operational use: ${dashboard.operationalUse.join(' | ')}.`
        : null,
      dashboard.businessQuestions?.length
        ? `Business questions: ${dashboard.businessQuestions.join(' | ')}.`
        : null,
      dashboard.refresh?.cadence
        ? `Refresh cadence: ${dashboard.refresh.cadence}.`
        : null,
      dashboard.refresh?.sla ? `SLA: ${dashboard.refresh.sla}.` : null,
      dashboard.caveats?.length
        ? `Caveats: ${dashboard.caveats.join(' | ')}.`
        : null,
    ],
    {
      source: profile.context.source,
      dashboard,
      table_annotations: Object.keys(profile.context.data.tables ?? {}).length,
      measure_annotations: Object.keys(profile.context.data.measures ?? {}).length,
      page_annotations: Object.keys(profile.context.data.pages ?? {}).length,
      source_annotations: Object.keys(profile.context.data.sources ?? {}).length,
    },
  );
}

function collectTableSignals(profile, tableName) {
  const signals = profile.analytical?.signals ?? {};
  const mappings = [
    ['temporal', signals.temporalColumns],
    ['state', signals.stateColumns],
    ['duration', signals.durationColumns],
    ['entity', signals.entityColumns],
    ['freshness', signals.freshnessColumns],
    ['numeric', signals.numericColumns],
  ];

  return mappings
    .filter(([, items]) => (items ?? []).some((item) => item.table === tableName))
    .map(([name]) => name);
}

function resolvePageContext(profile, page) {
  return profile.context?.data?.pages?.[page.name] ??
    profile.context?.data?.pages?.[page.id] ??
    null;
}

function chunk(id, type, textParts, metadata) {
  return {
    id,
    type,
    text: textParts.filter(Boolean).join('\n'),
    metadata,
  };
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    String(left).localeCompare(String(right)),
  );
}

function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return 'unknown';
  }
  return `${Math.round(number * 1000) / 10}%`;
}

function formatScore(value) {
  const number = Number(value);
  return Number.isFinite(number)
    ? String(Math.round(number * 1000) / 1000)
    : 'unknown';
}
