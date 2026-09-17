const TEMPORAL_NAME_RE = /(^|\s)(date|data|datetime|timestamp|time|hora|hour|day|dia|month|mes|m[eê]s|year|ano|created|updated|atualiza[cç][aã]o|reference|refer[eê]ncia)(\s|$)/i;
const STATE_NAME_RE = /(^|\s)(status|state|estado|situa[cç][aã]o|condition|condi[cç][aã]o|online|offline|sla|flag|faixa|severity|severidade)(\s|$)/i;
const DURATION_NAME_RE = /(^|\s)(duration|dura[cç][aã]o|elapsed|tempo|hours?|horas?|minutes?|minutos?|days?|dias?|aging|age|latency|lat[eê]ncia)(\s|$)/i;
const ENTITY_NAME_RE = /(^|\s)(site|unidade|unit|device|dispositivo|camera|c[aâ]mera|sensor|asset|ativo|fornecedor|supplier|municipio|munic[ií]pio|region|regi[aã]o|location|local|id|name|nome)(\s|$)/i;
const FRESHNESS_NAME_RE = /(^|\s)(updated|modified|refresh|atualiza[cç][aã]o|ingest|load|carga|timestamp|created)(\s|$)/i;

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

const SERIES_VISUAL_TYPES = new Set([
  'lineChart',
  'areaChart',
  'stackedAreaChart',
  'clusteredColumnChart',
  'lineStackedColumnComboChart',
  'lineClusteredColumnComboChart',
]);

export function buildAnalyticalProfile(viewerModel, usage) {
  const signals = detectSignals(viewerModel, usage);
  const capabilities = buildCapabilities(signals);
  const opportunities = buildOpportunities(signals, capabilities);

  return {
    methodology: {
      scope:
        'Analytical relevance is inferred only from observable schema, DAX, visual bindings and naming/type signals. It does not assert business value or data quality.',
      confidence:
        'Confidence reflects convergence of independent structural signals, not statistical validation on row-level data.',
      identifierNormalization:
        'Column names are tokenized across CamelCase, acronym boundaries, snake_case, kebab-case, punctuation and whitespace before semantic name matching.',
    },
    signals,
    capabilities,
    opportunities,
  };
}

function detectSignals(viewerModel, usage) {
  const columns = viewerModel.columns ?? [];
  const visuals = viewerModel.visuals ?? [];
  const measures = viewerModel.measures ?? [];
  const columnUsage = new Map(
    (usage.columns ?? []).map((item) => [key(item.table, item.name), item]),
  );

  const temporalColumns = columns
    .filter((column) => isTemporalColumn(column))
    .map((column) => signalColumn(column, columnUsage, 'temporal'));
  const stateColumns = columns
    .filter((column) => nameMatches(column.name, STATE_NAME_RE))
    .map((column) => signalColumn(column, columnUsage, 'state'));
  const durationColumns = columns
    .filter((column) => nameMatches(column.name, DURATION_NAME_RE))
    .map((column) => signalColumn(column, columnUsage, 'duration'));
  const entityColumns = columns
    .filter((column) => isEntityColumn(column, columnUsage))
    .map((column) => signalColumn(column, columnUsage, 'entity'));
  const freshnessColumns = columns
    .filter((column) =>
      isTemporalColumn(column) && nameMatches(column.name, FRESHNESS_NAME_RE),
    )
    .map((column) => signalColumn(column, columnUsage, 'freshness'));
  const numericColumns = columns
    .filter((column) => NUMERIC_TYPES.has(String(column.dataType ?? '')))
    .map((column) => signalColumn(column, columnUsage, 'numeric'));

  const temporalMeasures = measures
    .filter((measure) => usesTimeIntelligence(measure.expression ?? ''))
    .map((measure) => ({
      table: measure.table,
      name: measure.name,
      expression: measure.expression ?? null,
    }));

  const seriesVisuals = visuals
    .filter((visual) => SERIES_VISUAL_TYPES.has(visual.type))
    .map((visual) => ({
      page: visual.page,
      visual: visual.id,
      type: visual.type,
      title: visual.title ?? null,
      fields: visual.fields ?? [],
    }));

  const stateTransitionReady = intersectTables(temporalColumns, stateColumns);
  const entityTemporalReady = intersectTables(temporalColumns, entityColumns);
  const numericTemporalReady = intersectTables(temporalColumns, numericColumns);

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
      temporalAndState: stateTransitionReady,
      temporalAndEntity: entityTemporalReady,
      temporalAndNumeric: numericTemporalReady,
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
        ...signals.tableIntersections.temporalAndState.map((table) => `table:${table}`),
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
        ...signals.tableIntersections.temporalAndState.map((table) => `table:${table}`),
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
        ...signals.tableIntersections.temporalAndNumeric.map((table) => `table:${table}`),
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
  const capabilityById = new Map(capabilities.map((item) => [item.id, item]));

  return [
    opportunity(
      'point-anomaly',
      'Anomalias pontuais em métricas',
      combineStrength(
        capabilityById.get('temporal-analysis'),
        signals.numericColumns.length + signals.temporalMeasures.length,
      ),
      [
        ...refs(signals.temporalColumns),
        ...refs(signals.numericColumns),
        ...measureRefs(signals.temporalMeasures),
      ],
      [
        'Confirm observation grain and cadence.',
        'Identify the metric whose deviations have operational meaning.',
        'Validate enough historical depth for baseline estimation.',
      ],
    ),
    opportunity(
      'contextual-anomaly',
      'Anomalias contextuais por entidade/período',
      combineStrength(
        capabilityById.get('peer-comparison'),
        signals.tableIntersections.temporalAndEntity.length,
      ),
      [
        ...refs(signals.entityColumns),
        ...refs(signals.temporalColumns),
        ...signals.tableIntersections.temporalAndEntity.map((table) => `table:${table}`),
      ],
      [
        'Define comparable peer groups.',
        'Validate contextual variables and cardinality.',
        'Separate expected seasonal variation from abnormal behavior.',
      ],
    ),
    opportunity(
      'collective-anomaly',
      'Anomalias coletivas e padrões persistentes',
      combineStrength(
        capabilityById.get('persistence-duration'),
        signals.seriesVisuals.length,
      ),
      [
        ...refs(signals.durationColumns),
        ...visualRefs(signals.seriesVisuals),
        ...signals.tableIntersections.temporalAndState.map((table) => `table:${table}`),
      ],
      [
        'Validate ordered repeated observations per entity.',
        'Define minimum episode length and gap tolerance.',
      ],
    ),
    opportunity(
      'state-transition-monitoring',
      'Monitoramento de transições de estado',
      capabilityById.get('state-transitions')?.strength ?? 0,
      [
        ...refs(signals.stateColumns),
        ...refs(signals.temporalColumns),
      ],
      [
        'Validate state domain and allowed transitions.',
        'Establish deterministic ordering for simultaneous events.',
      ],
    ),
    opportunity(
      'freshness-anomaly',
      'Anomalias de atraso/freshness',
      capabilityById.get('freshness-monitoring')?.strength ?? 0,
      refs(signals.freshnessColumns),
      [
        'Confirm which timestamp represents expected arrival/refresh.',
        'Define expected cadence by source or entity.',
      ],
    ),
    opportunity(
      'seasonal-baseline',
      'Baseline sazonal e desvio esperado',
      capabilityById.get('seasonality')?.strength ?? 0,
      [
        ...refs(signals.temporalColumns),
        ...visualRefs(signals.seriesVisuals),
      ],
      [
        'Validate historical depth and regularity.',
        'Choose the relevant seasonal cycle only after profiling row-level data.',
      ],
    ),
  ].sort((left, right) =>
    right.strength - left.strength || left.id.localeCompare(right.id),
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

function opportunity(id, title, strength, evidence, prerequisites) {
  const normalized = clamp(strength);
  const normalizedEvidence = unique(evidence);
  return {
    id,
    title,
    strength: round(normalized),
    status: opportunityStatus(normalized),
    confidence: confidenceBand(normalizedEvidence.length),
    evidence: normalizedEvidence,
    prerequisites,
    caveat:
      'This is a structural analytical opportunity, not evidence that an anomaly model will be useful in production.',
  };
}

function signalColumn(column, usageByKey, category) {
  const observed = usageByKey.get(key(column.table, column.name));
  return {
    category,
    table: column.table,
    name: column.name,
    dataType: column.dataType ?? null,
    visualReferences: observed?.visualReferences ?? 0,
    pageReferences: observed?.pageReferences ?? 0,
    roles: observed?.roles ?? [],
    vias: observed?.vias ?? [],
    confidence: columnNameConfidence(column, category),
  };
}

function isTemporalColumn(column) {
  return TEMPORAL_TYPES.has(String(column.dataType ?? '')) ||
    nameMatches(column.name, TEMPORAL_NAME_RE);
}

function isEntityColumn(column, usageByKey) {
  if (nameMatches(column.name, ENTITY_NAME_RE)) {
    return true;
  }

  const observed = usageByKey.get(key(column.table, column.name));
  const roleText = (observed?.roles ?? []).join(' ');
  const type = String(column.dataType ?? '').toLowerCase();
  return (
    (type === 'string' || type === 'text') &&
    /(category|axis|legend|group|rows|slicer)/i.test(roleText)
  );
}

function columnNameConfidence(column, category) {
  const type = String(column.dataType ?? '');
  if (category === 'temporal' && TEMPORAL_TYPES.has(type)) {
    return 'high';
  }
  if (category === 'numeric' && NUMERIC_TYPES.has(type)) {
    return 'high';
  }
  return 'medium';
}

function nameMatches(value, expression) {
  return expression.test(normalizeIdentifier(value));
}

function normalizeIdentifier(value) {
  return String(value ?? '')
    .replace(/([a-zà-öø-ÿ0-9])([A-ZÀ-ÖØ-Þ])/g, '$1 $2')
    .replace(/([A-ZÀ-ÖØ-Þ]+)([A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ])/g, '$1 $2')
    .replace(/[_\-./\\]+/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function usesTimeIntelligence(expression) {
  return /\b(TOTALYTD|TOTALMTD|TOTALQTD|DATESYTD|DATESMTD|DATESQTD|SAMEPERIODLASTYEAR|DATEADD|DATESBETWEEN|DATESINPERIOD|PREVIOUSYEAR|PREVIOUSMONTH|PARALLELPERIOD)\s*\(/i.test(
    expression,
  );
}

function intersectTables(left, right) {
  const leftTables = new Set(left.map((item) => item.table));
  return unique(
    right.map((item) => item.table).filter((table) => leftTables.has(table)),
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

function combineStrength(capabilityItem, additionalEvidence) {
  const base = capabilityItem?.strength ?? 0;
  return clamp(base * 0.7 + evidenceToStrength(additionalEvidence) * 0.3);
}

function evidenceToStrength(count) {
  if (count <= 0) {
    return 0;
  }
  if (count === 1) {
    return 0.35;
  }
  if (count <= 3) {
    return 0.60;
  }
  if (count <= 6) {
    return 0.80;
  }
  return 1;
}

function strengthStatus(strength) {
  if (strength >= 0.75) {
    return 'strong-structural-support';
  }
  if (strength >= 0.40) {
    return 'partial-structural-support';
  }
  return 'not-observed';
}

function opportunityStatus(strength) {
  if (strength >= 0.75) {
    return 'supported-candidate';
  }
  if (strength >= 0.40) {
    return 'candidate-needs-validation';
  }
  return 'insufficient-structural-evidence';
}

function confidenceBand(evidenceCount) {
  if (evidenceCount >= 5) {
    return 'high';
  }
  if (evidenceCount >= 2) {
    return 'medium';
  }
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
