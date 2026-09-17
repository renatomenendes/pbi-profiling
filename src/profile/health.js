export function buildHealthProfile(viewerModel, usage) {
  const findings = [];

  const unresolvedColumns = (viewerModel.columns ?? []).filter(
    (column) =>
      column.confidence === 'unknown' ||
      column.sourceless === 'unresolved',
  );

  if (unresolvedColumns.length > 0) {
    findings.push({
      code: 'unresolved-source-columns',
      severity: 'warning',
      title: 'Columns without a resolved physical source',
      count: unresolvedColumns.length,
      evidence: unresolvedColumns.map((column) => ({
        table: column.table,
        column: column.name,
        reason: column.reason ?? null,
      })),
    });
  }

  const hiddenPages = (viewerModel.pages ?? []).filter(
    (page) => page.isHidden,
  );

  if (hiddenPages.length > 0) {
    findings.push({
      code: 'hidden-pages',
      severity: 'info',
      title: 'Hidden report pages',
      count: hiddenPages.length,
      evidence: hiddenPages.map((page) => ({
        id: page.id,
        name: page.name,
      })),
    });
  }

  const neverShownVisuals = (viewerModel.visuals ?? []).filter(
    (visual) => visual.neverShown,
  );

  if (neverShownVisuals.length > 0) {
    findings.push({
      code: 'never-shown-visuals',
      severity: 'warning',
      title: 'Visuals that are never shown',
      count: neverShownVisuals.length,
      evidence: neverShownVisuals.map((visual) => ({
        page: visual.page,
        visual: visual.id,
        type: visual.type,
        title: visual.title ?? null,
      })),
    });
  }

  if (usage.unusedMeasures.length > 0) {
    findings.push({
      code: 'unused-measures',
      severity: 'info',
      title: 'Measures without observed report or measure usage',
      count: usage.unusedMeasures.length,
      evidence: usage.unusedMeasures.map((measure) => ({
        table: measure.table,
        measure: measure.name,
      })),
    });
  }

  const unresolvedBindings = [];

  for (const visual of viewerModel.visuals ?? []) {
    for (const field of visual.fields ?? []) {
      if (!field.ref && field.name) {
        unresolvedBindings.push({
          page: visual.page,
          visual: visual.id,
          fieldKind: field.kind,
          table: field.table ?? null,
          field: field.name,
          via: field.via ?? null,
        });
      }
    }
  }

  if (unresolvedBindings.length > 0) {
    findings.push({
      code: 'unresolved-visual-bindings',
      severity: 'warning',
      title: 'Visual field bindings not resolved to model objects',
      count: unresolvedBindings.length,
      evidence: unresolvedBindings,
    });
  }

  const confidence = viewerModel.stats?.confidence ?? null;
  const coverage = confidence?.coverage ?? calculateCoverage(viewerModel.columns);

  return {
    sourceResolutionCoverage: coverage,
    findings,
    counts: {
      warnings: findings.filter((item) => item.severity === 'warning').length,
      info: findings.filter((item) => item.severity === 'info').length,
      errors: findings.filter((item) => item.severity === 'error').length,
    },
  };
}

function calculateCoverage(columns = []) {
  const physicalCandidates = columns.filter(
    (column) => column.sourceless !== 'computed-dax',
  );

  if (physicalCandidates.length === 0) {
    return null;
  }

  const resolved = physicalCandidates.filter(
    (column) =>
      column.confidence === 'exact' ||
      column.confidence === 'inferred',
  ).length;

  return resolved / physicalCandidates.length;
}
