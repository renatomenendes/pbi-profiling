/*
 * Complexity profiling is conceptually informed by pbi-semantic-doc's public MIT
 * complexity index, but this implementation is original and deliberately exposes
 * every component instead of presenting a single opaque score.
 *
 * Reference evaluated:
 * https://github.com/ViciusLio/pbi-semantic-doc
 * commit 3e653828e4957ba7fb698ad92b1ff8bf4f791182
 */

const DAX_PATTERN_GROUPS = Object.freeze({
  contextModification: [
    'CALCULATE',
    'CALCULATETABLE',
    'ALL',
    'ALLEXCEPT',
    'ALLSELECTED',
    'REMOVEFILTERS',
    'KEEPFILTERS',
  ],
  iterators: [
    'SUMX',
    'AVERAGEX',
    'MINX',
    'MAXX',
    'COUNTX',
    'RANKX',
    'FILTER',
  ],
  timeIntelligence: [
    'TOTALYTD',
    'TOTALMTD',
    'TOTALQTD',
    'DATESYTD',
    'DATESMTD',
    'DATESQTD',
    'SAMEPERIODLASTYEAR',
    'DATEADD',
    'DATESBETWEEN',
    'DATESINPERIOD',
    'PREVIOUSYEAR',
    'PREVIOUSMONTH',
    'PARALLELPERIOD',
  ],
  branching: [
    'IF',
    'SWITCH',
    'COALESCE',
  ],
  virtualRelationships: [
    'USERELATIONSHIP',
    'TREATAS',
    'CROSSFILTER',
  ],
  tableConstruction: [
    'SUMMARIZE',
    'SUMMARIZECOLUMNS',
    'ADDCOLUMNS',
    'SELECTCOLUMNS',
    'GROUPBY',
    'TOPN',
    'VALUES',
    'DISTINCT',
  ],
});

const COMPLEXITY_FORMULA = Object.freeze({
  expressionLength: {
    weight: 0.25,
    referenceMaximum: 800,
  },
  patternBreadth: {
    weight: 0.25,
    referenceMaximum: Object.keys(DAX_PATTERN_GROUPS).length,
  },
  dependencyBreadth: {
    weight: 0.20,
    referenceMaximum: 12,
  },
  nestingDepth: {
    weight: 0.15,
    referenceMaximum: 8,
  },
  structuralDensity: {
    weight: 0.15,
    referenceMaximum: 16,
  },
});

const MODEL_FORMULA = Object.freeze({
  averageMeasureComplexity: { weight: 0.35 },
  measures: { weight: 0.20, referenceMaximum: 150 },
  tables: { weight: 0.15, referenceMaximum: 30 },
  relationships: { weight: 0.10, referenceMaximum: 50 },
  columns: { weight: 0.10, referenceMaximum: 300 },
  calculatedObjects: { weight: 0.10, referenceMaximum: 50 },
});

const REPORT_FORMULA = Object.freeze({
  pages: { weight: 0.20, referenceMaximum: 50 },
  visuals: { weight: 0.40, referenceMaximum: 300 },
  bookmarks: { weight: 0.15, referenceMaximum: 30 },
  hiddenVisuals: { weight: 0.10, referenceMaximum: 50 },
  fieldBindings: { weight: 0.15, referenceMaximum: 500 },
});

export function buildComplexityProfile(viewerModel) {
  const measures = (viewerModel.measures ?? [])
    .map(analyzeMeasureComplexity)
    .sort((left, right) =>
      right.score - left.score ||
      left.table.localeCompare(right.table) ||
      left.name.localeCompare(right.name),
    );

  const averageMeasureComplexity = measures.length
    ? average(measures.map((measure) => measure.score))
    : 0;

  const calculatedObjects =
    (viewerModel.tables ?? []).filter((table) => table.isCalculated).length +
    (viewerModel.columns ?? []).filter((column) => column.expression).length;

  const semanticModel = weightedIndex({
    averageMeasureComplexity,
    measures: normalize(
      viewerModel.measures?.length ?? 0,
      MODEL_FORMULA.measures.referenceMaximum,
    ),
    tables: normalize(
      viewerModel.tables?.length ?? 0,
      MODEL_FORMULA.tables.referenceMaximum,
    ),
    relationships: normalize(
      viewerModel.relationships?.length ?? 0,
      MODEL_FORMULA.relationships.referenceMaximum,
    ),
    columns: normalize(
      viewerModel.columns?.length ?? 0,
      MODEL_FORMULA.columns.referenceMaximum,
    ),
    calculatedObjects: normalize(
      calculatedObjects,
      MODEL_FORMULA.calculatedObjects.referenceMaximum,
    ),
  }, MODEL_FORMULA);

  const fieldBindings = (viewerModel.visuals ?? []).reduce(
    (total, visual) => total + (visual.fields?.length ?? 0),
    0,
  );
  const hiddenVisuals = (viewerModel.visuals ?? []).filter(
    (visual) => visual.isHidden,
  ).length;

  const report = weightedIndex({
    pages: normalize(
      viewerModel.pages?.length ?? 0,
      REPORT_FORMULA.pages.referenceMaximum,
    ),
    visuals: normalize(
      viewerModel.visuals?.length ?? 0,
      REPORT_FORMULA.visuals.referenceMaximum,
    ),
    bookmarks: normalize(
      viewerModel.bookmarks?.length ?? 0,
      REPORT_FORMULA.bookmarks.referenceMaximum,
    ),
    hiddenVisuals: normalize(
      hiddenVisuals,
      REPORT_FORMULA.hiddenVisuals.referenceMaximum,
    ),
    fieldBindings: normalize(
      fieldBindings,
      REPORT_FORMULA.fieldBindings.referenceMaximum,
    ),
  }, REPORT_FORMULA);

  const combined = round((semanticModel.score + report.score) / 2);

  return {
    methodology: {
      measureFormula: COMPLEXITY_FORMULA,
      modelFormula: MODEL_FORMULA,
      reportFormula: REPORT_FORMULA,
      interpretation:
        'Scores are normalized structural complexity indicators, not quality grades. ' +
        'Every score is derived only from observable PBIP structure and DAX syntax.',
    },
    combined: {
      score: combined,
      band: complexityBand(combined),
    },
    semanticModel,
    report,
    measures,
    hotspots: measures
      .filter((measure) => measure.score >= 0.50)
      .slice(0, 20),
  };
}

export function analyzeMeasureComplexity(measure) {
  const expression = String(measure.expression ?? '');
  const upper = expression.toUpperCase();
  const patternGroups = Object.fromEntries(
    Object.entries(DAX_PATTERN_GROUPS).map(([group, functions]) => [
      group,
      functions.filter((name) => hasFunction(upper, name)),
    ]),
  );
  const patternBreadth = Object.values(patternGroups).filter(
    (matches) => matches.length > 0,
  ).length;
  const dependencyCount =
    (measure.dependsOn?.measures?.length ?? 0) +
    (measure.dependsOn?.columns?.length ?? 0) +
    (measure.dependsOn?.tables?.length ?? 0);
  const variableCount = countMatches(upper, /\bVAR\b/g);
  const lineCount = expression ? expression.split(/\r?\n/).length : 0;
  const functionCalls = countMatches(upper, /\b[A-Z][A-Z0-9_.]*\s*\(/g);
  const nestingDepth = maxParenthesisDepth(expression);
  const structuralDensityRaw =
    variableCount +
    Math.max(0, lineCount - 1) +
    Math.min(functionCalls, 10);

  const components = {
    expressionLength: normalize(
      expression.length,
      COMPLEXITY_FORMULA.expressionLength.referenceMaximum,
    ),
    patternBreadth: normalize(
      patternBreadth,
      COMPLEXITY_FORMULA.patternBreadth.referenceMaximum,
    ),
    dependencyBreadth: normalize(
      dependencyCount,
      COMPLEXITY_FORMULA.dependencyBreadth.referenceMaximum,
    ),
    nestingDepth: normalize(
      nestingDepth,
      COMPLEXITY_FORMULA.nestingDepth.referenceMaximum,
    ),
    structuralDensity: normalize(
      structuralDensityRaw,
      COMPLEXITY_FORMULA.structuralDensity.referenceMaximum,
    ),
  };

  const score = weightedIndex(components, COMPLEXITY_FORMULA).score;

  return {
    table: measure.table,
    name: measure.name,
    score,
    band: complexityBand(score),
    metrics: {
      characters: expression.length,
      lines: lineCount,
      variables: variableCount,
      functionCalls,
      nestingDepth,
      dependencyCount,
      patternBreadth,
    },
    components,
    patterns: patternGroups,
  };
}

function weightedIndex(components, formula) {
  const contribution = {};
  let score = 0;

  for (const [name, specification] of Object.entries(formula)) {
    const value = clamp(Number(components[name] ?? 0));
    const weighted = value * specification.weight;
    contribution[name] = round(weighted);
    score += weighted;
  }

  const normalized = round(clamp(score));
  return {
    score: normalized,
    band: complexityBand(normalized),
    components: Object.fromEntries(
      Object.entries(components).map(([key, value]) => [key, round(value)]),
    ),
    contribution,
  };
}

function hasFunction(expressionUpper, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\s*\\(`, 'i').test(expressionUpper);
}

function countMatches(value, expression) {
  return [...String(value).matchAll(expression)].length;
}

function maxParenthesisDepth(expression) {
  let depth = 0;
  let maximum = 0;
  let inString = false;

  for (let index = 0; index < expression.length; index += 1) {
    const character = expression[index];

    if (character === '"') {
      if (inString && expression[index + 1] === '"') {
        index += 1;
        continue;
      }
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (character === '(') {
      depth += 1;
      maximum = Math.max(maximum, depth);
    } else if (character === ')') {
      depth = Math.max(0, depth - 1);
    }
  }

  return maximum;
}

function normalize(value, maximum) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }
  return clamp(numeric / maximum);
}

function average(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function complexityBand(score) {
  if (score >= 0.75) {
    return 'very-high';
  }
  if (score >= 0.50) {
    return 'high';
  }
  if (score >= 0.25) {
    return 'moderate';
  }
  return 'low';
}

function clamp(value) {
  return Math.min(1, Math.max(0, value));
}

function round(value) {
  return Math.round(Number(value) * 1000) / 1000;
}
