export function buildCliSummary(result) {
  const {
    profile,
    outputs,
    intake,
    workspacePath,
  } = result;

  return {
    project: profile.meta.projectName,
    model: profile.meta.modelName,
    report: profile.meta.reportName,
    intake: {
      ...intake,
      workspacePath: workspacePath ?? undefined,
    },
    outputs,
    counts: profile.overview.counts,
    health: profile.health.counts,
    sourceResolution: {
      physicalColumnCoverage:
        profile.sourceResolution.summary.physicalColumnCoverage,
      resourceLineageCoverage:
        profile.sourceResolution.summary.resourceLineageCoverage,
      physicalColumnResolved:
        profile.sourceResolution.summary.physicalColumnResolved,
      resourceResolved:
        profile.sourceResolution.summary.resourceResolved,
      inlineColumns:
        profile.sourceResolution.summary.inlineColumns,
      unresolvedColumns:
        profile.sourceResolution.summary.unresolvedColumns,
      computedColumns:
        profile.sourceResolution.summary.computedColumns,
    },
    complexity: profile.complexity.combined,
    maintenance: profile.maintenance.summary,
    context: {
      status: profile.context.status,
      source: profile.context.source,
      warnings: profile.context.warnings.length,
    },
    analyticalSemantics:
      profile.analytical.methodology.semanticConfiguration,
    analyticalOpportunities:
      profile.analytical.opportunities.filter(
        (item) =>
          item.status !==
          'insufficient-structural-evidence',
      ).length,
    lineageWarnings: [],
  };
}
