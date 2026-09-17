const SEMANTIC_CATEGORIES = [
  'temporal',
  'state',
  'duration',
  'entity',
  'freshness',
];

const DEFAULT_SEMANTIC_TERMS = Object.freeze({
  temporal: [
    'date', 'data', 'datetime', 'timestamp', 'time', 'hora',
    'day', 'dia', 'month', 'mes', 'mês', 'quarter', 'trimestre',
    'year', 'ano', 'created', 'criado', 'updated', 'atualizado',
    'modified', 'modificado', 'reference', 'referencia', 'referência',
    'event', 'evento',
  ],
  state: [
    'status', 'state', 'estado', 'condition', 'condicao', 'condição',
    'stage', 'estagio', 'estágio', 'phase', 'fase',
  ],
  duration: [
    'duration', 'duracao', 'duração', 'elapsed', 'tempo',
    'hour', 'hours', 'hora', 'horas', 'minute', 'minutes',
    'minuto', 'minutos', 'day', 'days', 'dia', 'dias',
    'age', 'aging', 'latency', 'latencia', 'latência',
  ],
  entity: [
    'id', 'key', 'chave', 'code', 'codigo', 'código',
    'name', 'nome', 'category', 'categoria', 'type', 'tipo',
    'group', 'grupo',
  ],
  freshness: [
    'updated', 'atualizado', 'modified', 'modificado',
    'refresh', 'refreshed', 'ingest', 'ingested', 'ingestion',
    'load', 'loaded', 'carga', 'arrival', 'chegada',
  ],
});

const NUMERIC_TYPES = new Set([
  'int64',
  'int32',
  'integer',
  'double',
  'decimal',
  'decimalNumber',
  'currency',
  'number',
]);

const TEMPORAL_TYPES = new Set([
  'dateTime',
  'date',
  'time',
  'datetime',
]);

const TEXT_TYPES = new Set(['string', 'text']);

const SERIES_VISUAL_TYPES = new Set([
  'lineChart',
  'areaChart',
  'stackedAreaChart',
  'clusteredColumnChart',
  'lineStackedColumnComboChart',
  'lineClusteredColumnComboChart',
]);

const GROUPING_ROLE_RE = /(^|\s)(category|axis|legend|group|rows?|slicer|series|details?)(\s|$)/i;

export function buildAnalyticalProfile(
  viewerModel,
  usage,
  profilingConfig = null,
) {
  const semantics = buildSemanticConfiguration(profilingConfig);
  const signals = detectSignals(viewerModel, usage, semantics);
  const capabilities = buildCapabilities(signals);
  const opportunities = buildOpportunities(signals, capabilities);

  return {
    methodology: {
      scope:
        'Analytical relevance is inferred only from observable schema, data types, DAX, relationships, visual bindings and explicitly bounded semantic hints. It does not assert business value or data quality.',
      confidence:
        'Confidence reflects convergence of independent structural evidence, not statistical validation on row-level data.',
      identifierNormalization:
        'Column names are tokenized across CamelCase, acronym boundaries, snake_case, kebab-case, punctuation and whitespace before exact token/phrase matching.',
      semanticPolicy:
        'The built-in vocabulary contains only generic analytical terms. Domain nouns are not embedded in the engine; optional project configuration may extend or replace semantic terms and add explicit column hints.',
      opportunityPolicy:
        'Analytical opportunities span descriptive, diagnostic, operational-monitoring, baseline, forecasting and anomaly-detection families. Anomaly detection is one family, not the organizing purpose of the profiler.',
      semanticConfiguration: {
        status: semantics.status,
        source: semantics.source,
        mode: semantics.mode,
        customTermCount: semantics.customTermCount,
        explicitColumnHints: semantics.explicitColumnHintCount,
      },
    },
    signals,
    capabilities,
    opportunities,
  };
}

function detectSignals(viewerModel, usage, semantics) {
  const columns = viewerModel.columns ?? [];
  const visuals = viewerModel.visuals ?? [];
  const measures = viewerModel.measures ?? [];
  const usageByColumn = new Map(
    (usage.columns ?? []).map((item) => [key(item.table, item.name), item]),
  );
  const relationshipColumns = collectRelationshipColumns(
    viewerModel.relationships ?? [],
  );

  const temporalColumns = collectColumnSignals(
    columns,
    'temporal',
    usageByColumn,
    relationshipColumns,
    semantics,
  );
  const stateColumns = collectColumnSignals(
    columns,
    'state',
    usageByColumn,
    relationshipColumns,
    semantics,
  );
  const durationColumns = collectColumnSignals(
    columns,
    'duration',
    usageByColumn,
    relationshipColumns,
    semantics,
  );
  const entityColumns = collectColumnSignals(
    columns,
    'entity',
    usageByColumn,
    relationshipColumns,
    semantics,
  );
  const freshnessColumns = collectColumnSignals(
    columns,
    'freshness',
    usageByColumn,
    relationshipColumns,
    semantics,
  );
  const numericColumns = collectColumnSignals(
    columns,
    'numeric',
    usageByColumn,
    relationshipColumns,
    semantics,
  );

  const temporalMeasures = measures
    .filter((measure) => usesTimeIntelligence(measure.expression ?? ''))
    .map((measure) => ({
      table: measure.table,
      name: measure.name,
      expression: measure.expression ?? null,
      confidence: 'high',
      evidence: ['dax-time-intelligence'],
    }));

  const seriesVisuals = visuals
    .filter((visual) => SERIES_VISUAL_TYPES.has(visual.type))
    .map((visual) => ({
      page: visual.page,
      visual: visual.id,
      type: visual.type,
      title: visual.title ?? null,
      fields: visual.fields ?? [],
      evidence: ['visual-type'],
    }));

  return {
    temporalColumns,
    temporalMeasures,
    stateColumns,
    durationColumns,
    entityColumns,
    freshnessColumns,
    numericColumns,
    seriesVisuals,
    tableIntersections: {
      temporalAndState: intersectTables(temporalColumns, stateColumns),
      temporalAndEntity: intersectTables(temporalColumns, entityColumns),
      temporalAndNumeric: intersectTables(temporalColumns, numericColumns),
    },
    counts: {
      temporalColumns: temporalColumns.length,
      temporalMeasures: temporalMeasures.length,
      stateColumns: stateColumns.length,
      durationColumns: durationColumns.length,
      entityColumns: entityColumns.length,
      freshnessColumns: freshnessColumns.length,
      numericColumns: numericColumns.length,
      seriesVisuals: seriesVisuals.length,
    },
  };
}

function collectColumnSignals(
  columns,
  category,
  usageByColumn,
  relationshipColumns,
  semantics,
) {
  return columns
    .map((column) => classifyColumnSignal(
      column,
      category,
      usageByColumn,
      relationshipColumns,
      semantics,
    ))
    .filter(Boolean);
}

function classifyColumnSignal(
  column,
  category,
  usageByColumn,
  relationshipColumns,
  semantics,
) {
  const observed = usageByColumn.get(key(column.table, column.name));
  const evidence = [];
  const type = String(column.dataType ?? '');
  const reference = `${column.table}[${column.name}]`;

  if (category === 'numeric' && NUMERIC_TYPES.has(type)) {
    evidence.push('data-type:numeric');
  }

  if (category === 'temporal' && TEMPORAL_TYPES.has(type)) {
    evidence.push('data-type:temporal');
  }

  if (
    category === 'entity' &&
    relationshipColumns.has(reference)
  ) {
    evidence.push('relationship-key');
  }

  if (
    category === 'entity' &&
    TEXT_TYPES.has(type.toLowerCase()) &&
    hasGroupingRole(observed?.roles ?? [])
  ) {
    evidence.push('visual-grouping-role');
  }

  if (category !== 'numeric') {
    evidence.push(...semanticNameEvidence(column.name, category, semantics));

    if (semantics.columnHints.get(reference)?.has(category)) {
      evidence.push('explicit-column-hint');
    }
  }

  const normalizedEvidence = unique(evidence);
  if (normalizedEvidence.length === 0) {
    return null;
  }

  return {
    category,
    table: column.table,
    name: column.name,
    dataType: column.dataType ?? null,
    visualReferences: observed?.visualReferences ?? 0,
    pageReferences: observed?.pageReferences ?? 0,
    roles: observed?.roles ?? [],
    vias: observed?.vias ?? [],
    confidence: evidenceConfidence(normalizedEvidence),
    evidence: normalizedEvidence,
  };
}

function semanticNameEvidence(name, category, semantics) {
  const normalized = normalizeIdentifier(name);
  const evidence = [];

  if (
    semantics.defaultTerms[category]?.some((term) =>
      phraseMatches(normalized, term),
    )
  ) {
    evidence.push('default-lexicon');
  }

  if (
    semantics.customTerms[category]?.some((term) =>
      phraseMatches(normalized, term),
    )
  ) {
    evidence.push('custom-semantic-term');
  }

  return evidence;
}

function phraseMatches(normalizedIdentifier, normalizedTerm) {
  if (!normalizedIdentifier || !normalizedTerm) {
    return false;
  }

  return (
    normalizedIdentifier === normalizedTerm ||
    ` ${normalizedIdentifier} `.includes(` ${normalizedTerm} `)
  );
}

function hasGroupingRole(roles) {
  return roles.some((role) =>
    GROUPING_ROLE_RE.test(normalizeIdentifier(role)),
  );
}

function collectRelationshipColumns(relationships) {
  const result = new Set();

  for (const relationship of relationships) {
    if (relationship.fromTable && relationship.fromColumn) {
      result.add(`${relationship.fromTable}[${relationship.fromColumn}]`);
    }
    if (relationship.toTable && relationship.toColumn) {
      result.add(`${relationship.toTable}[${relationship.toColumn}]`);
    }
  }

  return result;
}

function buildSemanticConfiguration(profilingConfig) {
  const hints = profilingConfig?.data?.analysis?.semanticHints ?? {};
  const mode = hints.mode === 'replace' ? 'replace' : 'extend';
  const customTerms = normalizeTermMap(hints.terms ?? {});
  const defaultTerms = mode === 'replace'
    ? emptyTermMap()
    : normalizeTermMap(DEFAULT_SEMANTIC_TERMS);
  const columnHints = new Map(
    Object.entries(hints.columns ?? {}).map(([reference, categories]) => [
      reference,
      new Set(categories),
    ]),
  );

  return {
    status: profilingConfig?.status ?? 'not-provided',
    source: profilingConfig?.source ?? null,
    mode,
    defaultTerms,
    customTerms,
    columnHints,
    customTermCount: Object.values(customTerms)
      .reduce((total, terms) => total + terms.length, 0),
    explicitColumnHintCount: columnHints.size,
  };
}

function normalizeTermMap(value) {
  return Object.fromEntries(
    SEMANTIC_CATEGORIES.map((category) => [
      category,
      unique(
        (value[category] ?? [])
          .map(normalizeIdentifier)
          .filter(Boolean),
      ),
    ]),
  );
}

function emptyTermMap() {
  return Object.fromEntries(
    SEMANTIC_CATEGORIES.map((category) => [category, []]),
  );
}

function buildCapabilities(signals) {
  return [
    capability(
      'temporal-analysis',
      'Análise temporal',
      signals.temporalColumns.length + signals.temporalMeasures.length,
      [
        ...refs(signals.temporalColumns),
        ...measureRefs(signals.temporalMeasures),
      ],
      'Requires a trustworthy event/reference time at the grain being analyzed.',
    ),
    capability(
      'state-transitions',
      'Transições de estado',
      signals.tableIntersections.temporalAndState.length * 2 +
        signals.stateColumns.length,
      [
        ...refs(signals.stateColumns),
        ...tableRefs(signals.tableIntersections.temporalAndState),
      ],
      'Transition analysis is strongest when repeated observations exist for the same entity.',
    ),
    capability(
      'persistence-duration',
      'Persistência e duração',
      signals.durationColumns.length * 2 +
        signals.tableIntersections.temporalAndState.length,
      [
        ...refs(signals.durationColumns),
        ...tableRefs(signals.tableIntersections.temporalAndState),
      ],
      'Duration can be explicit or derivable only after row-level grain and ordering are validated.',
    ),
    capability(
      'peer-comparison',
      'Comparação entre pares',
      signals.entityColumns.length +
        signals.tableIntersections.temporalAndNumeric.length,
      [
        ...refs(signals.entityColumns),
        ...tableRefs(signals.tableIntersections.temporalAndNumeric),
      ],
      'Peer groups must be semantically comparable before deviation scores are meaningful.',
    ),
    capability(
      'freshness-monitoring',
      'Monitoramento de freshness',
      signals.freshnessColumns.length * 2,
      refs(signals.freshnessColumns),
      'Timestamp semantics must distinguish source-event time from ingestion/refresh time.',
    ),
    capability(
      'seasonality',
      'Sazonalidade',
      signals.temporalColumns.length +
        signals.seriesVisuals.length +
        signals.temporalMeasures.length,
      [
        ...refs(signals.temporalColumns),
        ...visualRefs(signals.seriesVisuals),
        ...measureRefs(signals.temporalMeasures),
      ],
      'Seasonality requires enough history and stable observation cadence; PBIP structure alone cannot prove either.',
    ),
  ];
}

function buildOpportunities(signals, capabilities) {
  const capabilityById = new Map(
    capabilities.map((item) => [item.id, item]),
  );
  const temporal = capabilityById.get('temporal-analysis');
  const transitions = capabilityById.get('state-transitions');
  const persistence = capabilityById.get('persistence-duration');
  const peers = capabilityById.get('peer-comparison');
  const freshness = capabilityById.get('freshness-monitoring');
  const seasonality = capabilityById.get('seasonality');
  const temporalNumericEvidence =
    signals.tableIntersections.temporalAndNumeric.length * 2 +
    signals.temporalMeasures.length;

  return [
    opportunity(
      'trend-analysis',
      'descriptive',
      'Tendência e evolução temporal',
      combineStrength(temporal, signals.seriesVisuals.length),
      [
        ...refs(signals.temporalColumns),
        ...measureRefs(signals.temporalMeasures),
        ...visualRefs(signals.seriesVisuals),
      ],
      [
        'Confirm which temporal field represents the analytical timeline.',
        'Validate observation grain and cadence before interpreting changes over time.',
      ],
    ),
    opportunity(
      'state-transition-monitoring',
      'process-behavior',
      'Transições e comportamento de estados',
      transitions?.strength ?? 0,
      [
        ...refs(signals.stateColumns),
        ...refs(signals.temporalColumns),
        ...tableRefs(signals.tableIntersections.temporalAndState),
      ],
      [
        'Validate the state domain and allowed transitions.',
        'Establish deterministic ordering for repeated or simultaneous observations.',
      ],
    ),
    opportunity(
      'duration-persistence-analysis',
      'process-behavior',
      'Duração, permanência e persistência',
      persistence?.strength ?? 0,
      [
        ...refs(signals.durationColumns),
        ...tableRefs(signals.tableIntersections.temporalAndState),
      ],
      [
        'Confirm whether duration is explicit or must be derived from ordered observations.',
        'Validate event gaps and episode boundaries.',
      ],
    ),
    opportunity(
      'peer-comparison-analysis',
      'diagnostic',
      'Comparação entre entidades e grupos',
      peers?.strength ?? 0,
      [
        ...refs(signals.entityColumns),
        ...refs(signals.numericColumns),
        ...tableRefs(signals.tableIntersections.temporalAndNumeric),
      ],
      [
        'Define semantically comparable peer groups.',
        'Validate cardinality and aggregation grain before ranking or benchmarking.',
      ],
    ),
    opportunity(
      'freshness-monitoring',
      'data-operations',
      'Monitoramento de atualização e atraso',
      freshness?.strength ?? 0,
      refs(signals.freshnessColumns),
      [
        'Confirm which timestamp represents expected arrival, ingestion or refresh.',
        'Define expected cadence by source or entity.',
      ],
    ),
    opportunity(
      'seasonal-baseline',
      'baseline-modeling',
      'Baseline sazonal e comportamento esperado',
      seasonality?.strength ?? 0,
      [
        ...refs(signals.temporalColumns),
        ...visualRefs(signals.seriesVisuals),
        ...measureRefs(signals.temporalMeasures),
      ],
      [
        'Validate historical depth and regularity.',
        'Choose the relevant seasonal cycle only after profiling row-level data.',
      ],
    ),
    opportunity(
      'forecasting-candidate',
      'forecasting',
      'Previsão de métricas ao longo do tempo',
      combineStrength(seasonality, temporalNumericEvidence),
      [
        ...refs(signals.temporalColumns),
        ...refs(signals.numericColumns),
        ...visualRefs(signals.seriesVisuals),
        ...tableRefs(signals.tableIntersections.temporalAndNumeric),
      ],
      [
        'Choose a forecast target with clear business semantics.',
        'Validate historical depth, cadence, missing intervals and regime changes.',
        'Benchmark against simple seasonal and persistence baselines before using complex models.',
      ],
    ),
    opportunity(
      'point-anomaly',
      'anomaly-detection',
      'Anomalias pontuais em métricas',
      combineStrength(temporal, temporalNumericEvidence),
      [
        ...refs(signals.temporalColumns),
        ...refs(signals.numericColumns),
        ...measureRefs(signals.temporalMeasures),
        ...tableRefs(signals.tableIntersections.temporalAndNumeric),
      ],
      [
        'Confirm observation grain and cadence.',
        'Identify the metric whose deviations have business meaning.',
        'Validate enough historical depth for baseline estimation.',
      ],
    ),
    opportunity(
      'contextual-anomaly',
      'anomaly-detection',
      'Anomalias contextuais por entidade/período',
      combineStrength(
        peers,
        signals.tableIntersections.temporalAndEntity.length,
      ),
      [
        ...refs(signals.entityColumns),
        ...refs(signals.temporalColumns),
        ...tableRefs(signals.tableIntersections.temporalAndEntity),
      ],
      [
        'Define comparable peer groups.',
        'Validate contextual variables and cardinality.',
        'Separate expected periodic variation from abnormal behavior.',
      ],
    ),
    opportunity(
      'collective-anomaly',
      'anomaly-detection',
      'Anomalias coletivas e padrões persistentes',
      combineStrength(persistence, signals.seriesVisuals.length),
      [
        ...refs(signals.durationColumns),
        ...visualRefs(signals.seriesVisuals),
        ...tableRefs(signals.tableIntersections.temporalAndState),
      ],
      [
        'Validate ordered repeated observations per entity.',
        'Define minimum episode length and gap tolerance.',
      ],
    ),
  ].sort((left, right) =>
    right.strength - left.strength ||
    left.family.localeCompare(right.family) ||
    left.id.localeCompare(right.id),
  );
}

function capability(id, title, evidenceStrength, evidence, caveat) {
  const strength = evidenceToStrength(evidenceStrength);
  const normalizedEvidence = unique(evidence);

  return {
    id,
    title,
    strength,
    status: strengthStatus(strength),
    confidence: confidenceBand(normalizedEvidence.length),
    evidence: normalizedEvidence,
    caveat,
  };
}

function opportunity(
  id,
  family,
  title,
  strength,
  evidence,
  prerequisites,
) {
  const normalized = clamp(strength);
  const normalizedEvidence = unique(evidence);

  return {
    id,
    family,
    title,
    strength: round(normalized),
    status: opportunityStatus(normalized),
    confidence: confidenceBand(normalizedEvidence.length),
    evidence: normalizedEvidence,
    prerequisites,
    caveat:
      'This is a structural analytical opportunity, not evidence that this analysis will be useful in production.',
  };
}

function evidenceConfidence(evidence) {
  if (
    evidence.some((item) => [
      'explicit-column-hint',
      'data-type:temporal',
      'data-type:numeric',
      'relationship-key',
    ].includes(item))
  ) {
    return 'high';
  }

  return evidence.length > 0 ? 'medium' : 'none';
}

function normalizeIdentifier(value) {
  return String(value ?? '')
    .replace(/([a-zà-öø-ÿ0-9])([A-ZÀ-ÖØ-Þ])/g, '$1 $2')
    .replace(/([A-ZÀ-ÖØ-Þ]+)([A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ])/g, '$1 $2')
    .replace(/[_\-./\\]+/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function usesTimeIntelligence(expression) {
  return /\b(TOTALYTD|TOTALMTD|TOTALQTD|DATESYTD|DATESMTD|DATESQTD|SAMEPERIODLASTYEAR|DATEADD|DATESBETWEEN|DATESINPERIOD|PREVIOUSYEAR|PREVIOUSMONTH|PARALLELPERIOD)\s*\(/i.test(
    expression,
  );
}

function intersectTables(left, right) {
  const leftTables = new Set(left.map((item) => item.table));
  return unique(
    right
      .map((item) => item.table)
      .filter((table) => leftTables.has(table)),
  );
}

function refs(items) {
  return items.map((item) => `column:${item.table}[${item.name}]`);
}

function measureRefs(items) {
  return items.map((item) => `measure:${item.table}[${item.name}]`);
}

function visualRefs(items) {
  return items.map((item) => `visual:${item.page}/${item.visual}`);
}

function tableRefs(items) {
  return items.map((table) => `table:${table}`);
}

function combineStrength(capabilityItem, additionalEvidence) {
  const base = capabilityItem?.strength ?? 0;
  return clamp(
    base * 0.7 + evidenceToStrength(additionalEvidence) * 0.3,
  );
}

function evidenceToStrength(count) {
  if (count <= 0) return 0;
  if (count === 1) return 0.35;
  if (count <= 3) return 0.60;
  if (count <= 6) return 0.80;
  return 1;
}

function strengthStatus(strength) {
  if (strength >= 0.75) return 'strong-structural-support';
  if (strength >= 0.40) return 'partial-structural-support';
  return 'not-observed';
}

function opportunityStatus(strength) {
  if (strength >= 0.75) return 'supported-candidate';
  if (strength >= 0.40) return 'candidate-needs-validation';
  return 'insufficient-structural-evidence';
}

function confidenceBand(evidenceCount) {
  if (evidenceCount >= 5) return 'high';
  if (evidenceCount >= 2) return 'medium';
  return evidenceCount === 1 ? 'low' : 'none';
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    String(left).localeCompare(String(right)),
  );
}

function key(table, name) {
  return `${table}\u0000${name}`;
}

function clamp(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

function round(value) {
  return Math.round(Number(value) * 1000) / 1000;
}
