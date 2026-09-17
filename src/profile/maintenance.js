export function buildMaintenanceProfile(
  viewerModel,
  {
    importance,
    complexity,
    context,
    health,
  } = {},
) {
  const measureImportance = new Map(
    (importance?.measures ?? []).map((item) => [key(item.table, item.name), item]),
  );
  const measureComplexity = new Map(
    (complexity?.measures ?? []).map((item) => [key(item.table, item.name), item]),
  );
  const measureContext = context?.data?.measures ?? {};
  const measures = viewerModel.measures ?? [];
  const maximumDependencyBreadth = Math.max(
    1,
    ...measures.map(dependencyBreadth),
  );

  const measureHotspots = measures
    .map((measure) => {
      const objectKey = key(measure.table, measure.name);
      const centrality = measureImportance.get(objectKey)?.score ?? 0;
      const logicComplexity = measureComplexity.get(objectKey)?.score ?? 0;
      const dependencies = dependencyBreadth(measure);
      const contextEntry = measureContext[`${measure.table}[${measure.name}]`] ?? null;
      const hasTechnicalDescription = Boolean(
        String(measure.description ?? '').trim(),
      );
      const hasBusinessDefinition = Boolean(
        String(
          contextEntry?.businessDefinition ??
          contextEntry?.businessMeaning ??
          '',
        ).trim(),
      );
      const documentationGap =
        hasTechnicalDescription || hasBusinessDefinition ? 0 : 1;
      const components = {
        structuralCentrality: clamp(centrality),
        daxComplexity: clamp(logicComplexity),
        dependencyBreadth: normalize(dependencies, maximumDependencyBreadth),
        documentationGap,
      };
      const score = round(
        components.structuralCentrality * 0.40 +
        components.daxComplexity * 0.35 +
        components.dependencyBreadth * 0.15 +
        components.documentationGap * 0.10,
      );

      return {
        table: measure.table,
        name: measure.name,
        score,
        band: attentionBand(score),
        components: roundObject(components),
        evidence: {
          dependencyCount: dependencies,
          technicalDescriptionPresent: hasTechnicalDescription,
          businessDefinitionPresent: hasBusinessDefinition,
          structuralImportance: centrality,
          daxComplexity: logicComplexity,
        },
        reasons: maintenanceReasons({
          centrality,
          logicComplexity,
          dependencies,
          hasTechnicalDescription,
          hasBusinessDefinition,
        }),
      };
    })
    .sort(compareAttention);

  const sourceDependencies = buildSourceDependencies(viewerModel.sources ?? []);
  const documentation = buildDocumentationCoverage(
    viewerModel,
    context,
  );
  const unresolvedFindings = (health?.findings ?? [])
    .filter((finding) =>
      [
        'unresolved-source-columns',
        'unresolved-visual-bindings',
        'broken-model-references',
        'page-definition-parse-errors',
      ].includes(finding.code),
    )
    .map((finding) => ({
      code: finding.code,
      severity: finding.severity,
      count: finding.count ?? finding.evidence?.length ?? 0,
    }));

  return {
    methodology: {
      scope:
        'Maintenance attention prioritizes objects that are costly or risky to change because they are central, complex, dependency-heavy or undocumented. It is not a quality score and does not imply a defect.',
      measureWeights: {
        structuralCentrality: 0.40,
        daxComplexity: 0.35,
        dependencyBreadth: 0.15,
        documentationGap: 0.10,
      },
      documentationPolicy:
        'A measure is considered documented when either its TMDL description or an explicit business definition/meaning exists in the optional context sidecar.',
    },
    summary: {
      highAttentionMeasures: measureHotspots.filter(
        (item) => item.score >= 0.50,
      ).length,
      criticalAttentionMeasures: measureHotspots.filter(
        (item) => item.score >= 0.75,
      ).length,
      operationalDependencies: sourceDependencies.totalFlagged,
      unresolvedStructuralFindings: unresolvedFindings.reduce(
        (total, finding) => total + finding.count,
        0,
      ),
    },
    documentation,
    sourceDependencies,
    unresolvedStructuralFindings: unresolvedFindings,
    measures: measureHotspots,
    hotspots: measureHotspots.slice(0, 20),
  };
}

function buildDocumentationCoverage(viewerModel, context) {
  const measures = viewerModel.measures ?? [];
  const tables = viewerModel.tables ?? [];
  const pages = viewerModel.pages ?? [];
  const contextData = context?.data ?? {};

  const describedMeasures = measures.filter((measure) =>
    Boolean(String(measure.description ?? '').trim()),
  ).length;
  const businessDefinedMeasures = measures.filter((measure) => {
    const entry = contextData.measures?.[`${measure.table}[${measure.name}]`];
    return Boolean(
      String(entry?.businessDefinition ?? entry?.businessMeaning ?? '').trim(),
    );
  }).length;
  const contextualizedTables = tables.filter((table) =>
    Boolean(contextData.tables?.[table.name]),
  ).length;
  const contextualizedPages = pages.filter((page) =>
    Boolean(
      contextData.pages?.[page.name] ||
      contextData.pages?.[page.id],
    ),
  ).length;

  return {
    tmdlMeasureDescriptions: ratio(describedMeasures, measures.length),
    businessMeasureDefinitions: ratio(
      businessDefinedMeasures,
      measures.length,
    ),
    tableBusinessContext: ratio(contextualizedTables, tables.length),
    pageBusinessContext: ratio(contextualizedPages, pages.length),
    counts: {
      measures: measures.length,
      describedMeasures,
      businessDefinedMeasures,
      tables: tables.length,
      contextualizedTables,
      pages: pages.length,
      contextualizedPages,
    },
  };
}

function buildSourceDependencies(sources) {
  const gateway = sources.filter((source) => source.gatewayRequired === true);
  const nativeQuery = sources.filter((source) => source.isNativeQuery === true);
  const parameterized = sources.filter((source) => source.parameterized === true);
  const flaggedRefs = new Set([
    ...gateway.map(sourceIdentity),
    ...nativeQuery.map(sourceIdentity),
    ...parameterized.map(sourceIdentity),
  ]);

  return {
    gatewayRequired: gateway.map(summarizeSource),
    nativeQueries: nativeQuery.map(summarizeSource),
    parameterized: parameterized.map(summarizeSource),
    totalFlagged: flaggedRefs.size,
    interpretation:
      'These are operational dependencies to understand during maintenance; they are not automatically problems.',
  };
}

function summarizeSource(source) {
  return {
    ref: source.ref ?? null,
    type: source.type ?? null,
    server: source.server ?? null,
    database: source.database ?? null,
    url: source.url ?? null,
    path: source.path ?? null,
  };
}

function sourceIdentity(source) {
  return source.ref ?? [
    source.type,
    source.server,
    source.database,
    source.url,
    source.path,
  ].filter(Boolean).join('|');
}

function dependencyBreadth(measure) {
  return (
    (measure.dependsOn?.measures?.length ?? 0) +
    (measure.dependsOn?.columns?.length ?? 0) +
    (measure.dependsOn?.tables?.length ?? 0)
  );
}

function maintenanceReasons({
  centrality,
  logicComplexity,
  dependencies,
  hasTechnicalDescription,
  hasBusinessDefinition,
}) {
  const reasons = [];
  if (centrality >= 0.50) {
    reasons.push('high-structural-centrality');
  }
  if (logicComplexity >= 0.50) {
    reasons.push('high-dax-complexity');
  }
  if (dependencies >= 6) {
    reasons.push('broad-dependency-surface');
  }
  if (!hasTechnicalDescription && !hasBusinessDefinition) {
    reasons.push('documentation-gap');
  }
  return reasons;
}

function attentionBand(score) {
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

function compareAttention(left, right) {
  return (
    right.score - left.score ||
    left.table.localeCompare(right.table) ||
    left.name.localeCompare(right.name)
  );
}

function ratio(numerator, denominator) {
  if (!denominator) {
    return null;
  }
  return round(numerator / denominator);
}

function normalize(value, maximum) {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) {
    return 0;
  }
  if (!Number.isFinite(Number(maximum)) || Number(maximum) <= 0) {
    return 0;
  }
  return clamp(Number(value) / Number(maximum));
}

function key(table, name) {
  return `${table}\u0000${name}`;
}

function roundObject(value) {
  return Object.fromEntries(
    Object.entries(value).map(([name, numeric]) => [name, round(numeric)]),
  );
}

function clamp(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

function round(value) {
  return Math.round(Number(value) * 1000) / 1000;
}
