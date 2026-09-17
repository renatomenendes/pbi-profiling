import { buildSourceResolutionProfile } from './source-resolution.js';

export function buildHealthProfile(
  viewerModel,
  usage,
  {
    pageMetadata = [],
    brokenReferences = [],
    sourceResolution = null,
  } = {},
) {
  const findings = [];
  const resolution = sourceResolution ?? buildSourceResolutionProfile(viewerModel);
  const columnResolution = new Map(
    (resolution.columns ?? []).map((item) => [
      `${item.table}\u0000${item.column}`,
      item,
    ]),
  );

  const resourceLevelColumns = (viewerModel.columns ?? []).filter((column) =>
    columnResolution.get(`${column.table}\u0000${column.name}`)?.level === 'resource',
  );

  if (resourceLevelColumns.length > 0) {
    findings.push({
      code: 'resource-level-source-columns',
      severity: 'info',
      title: 'Columns traced to an external resource but not to an addressable physical column',
      count: resourceLevelColumns.length,
      evidence: resourceLevelColumns.map((column) => ({
        table: column.table,
        column: column.name,
        system: columnResolution.get(`${column.table}\u0000${column.name}`)?.system ?? null,
        reason: column.reason ?? null,
      })),
    });
  }

  const inlineColumns = (viewerModel.columns ?? []).filter((column) =>
    columnResolution.get(`${column.table}\u0000${column.name}`)?.level === 'inline',
  );

  if (inlineColumns.length > 0) {
    findings.push({
      code: 'inline-source-columns',
      severity: 'info',
      title: 'Columns whose lineage terminates in inline/model-local data',
      count: inlineColumns.length,
      evidence: inlineColumns.map((column) => {
        const resolved = columnResolution.get(`${column.table}\u0000${column.name}`);
        return {
          table: column.table,
          column: column.name,
          sourceTable: resolved?.resolvedViaTable ?? column.table,
          reason: column.reason ?? null,
        };
      }),
    });
  }

  const unresolvedColumns = (viewerModel.columns ?? []).filter((column) =>
    columnResolution.get(`${column.table}\u0000${column.name}`)?.level === 'unresolved',
  );

  if (unresolvedColumns.length > 0) {
    findings.push({
      code: 'unresolved-source-columns',
      severity: 'warning',
      title: 'Columns whose source lineage remains unresolved',
      count: unresolvedColumns.length,
      evidence: unresolvedColumns.map((column) => ({
        table: column.table,
        column: column.name,
        reason: column.reason ?? null,
      })),
    });
  }

  const hiddenPages = pageMetadata.filter(
    (page) => page.isHidden === true,
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
        visibility: page.visibility,
      })),
    });
  }

  const pageParseErrors = pageMetadata.filter(
    (page) => page.parseError,
  );

  if (pageParseErrors.length > 0) {
    findings.push({
      code: 'page-definition-parse-errors',
      severity: 'warning',
      title: 'Page definitions that could not be parsed completely',
      count: pageParseErrors.length,
      evidence: pageParseErrors.map((page) => ({
        id: page.id,
        sourcePath: page.sourcePath,
        error: page.parseError,
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

  if (brokenReferences.length > 0) {
    findings.push({
      code: 'broken-model-references',
      severity: 'warning',
      title: 'Broken references reported by the dependency engine',
      count: brokenReferences.length,
      evidence: brokenReferences,
    });
  }

  const confidence = viewerModel.stats?.confidence ?? null;
  const coverage =
    confidence?.coverage ??
    calculateCoverage(viewerModel.columns);

  return {
    sourceResolutionCoverage: coverage,
    resourceLineageCoverage: resolution.summary.resourceLineageCoverage,
    sourceResolutionSummary: resolution.summary,
    findings,
    counts: {
      warnings: findings.filter(
        (item) => item.severity === 'warning',
      ).length,
      info: findings.filter(
        (item) => item.severity === 'info',
      ).length,
      errors: findings.filter(
        (item) => item.severity === 'error',
      ).length,
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
