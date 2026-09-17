import { buildRagChunks } from './rag.js';

export function buildExtendedRagChunks(profile) {
  const chunks = buildRagChunks(profile);
  const sourceResolution = profile.sourceResolution;

  if (sourceResolution) {
    chunks.push({
      id: `source-resolution::${profile.meta.projectName}`,
      type: 'source_resolution',
      text: [
        `Source resolution for ${profile.meta.projectName}.`,
        `Resource-lineage coverage: ${formatPercent(sourceResolution.summary?.resourceLineageCoverage)}.`,
        `Physical-column coverage: ${formatPercent(sourceResolution.summary?.physicalColumnCoverage)}.`,
        `Columns resolved to a physical column: ${sourceResolution.summary?.physicalColumnResolved ?? 0}.`,
        `Columns resolved only to a physical resource: ${sourceResolution.summary?.resourceResolved ?? 0}.`,
        `Columns still unresolved: ${sourceResolution.summary?.unresolvedColumns ?? 0}.`,
        `Computed columns excluded from source-lineage denominator: ${sourceResolution.summary?.computedColumns ?? 0}.`,
        sourceResolution.methodology?.caveat,
      ].filter(Boolean).join('\n'),
      metadata: {
        summary: sourceResolution.summary,
        methodology: sourceResolution.methodology,
        tables: sourceResolution.tables,
      },
    });
  }

  const maintenance = profile.maintenance;

  if (!maintenance) {
    return chunks;
  }

  chunks.push({
    id: `maintenance::${profile.meta.projectName}`,
    type: 'maintenance_overview',
    text: [
      `Maintenance profile for ${profile.meta.projectName}.`,
      `Measures requiring high maintenance attention: ${maintenance.summary?.highAttentionMeasures ?? 0}.`,
      `Measures requiring very high maintenance attention: ${maintenance.summary?.criticalAttentionMeasures ?? 0}.`,
      `Flagged operational source dependencies: ${maintenance.summary?.operationalDependencies ?? 0}.`,
      `Unresolved structural finding occurrences: ${maintenance.summary?.unresolvedStructuralFindings ?? 0}.`,
      `TMDL measure-description coverage: ${formatPercent(maintenance.documentation?.tmdlMeasureDescriptions)}.`,
      `Business-definition coverage: ${formatPercent(maintenance.documentation?.businessMeasureDefinitions)}.`,
      maintenance.methodology?.scope,
    ].filter(Boolean).join('\n'),
    metadata: {
      summary: maintenance.summary,
      documentation: maintenance.documentation,
      source_dependencies: maintenance.sourceDependencies,
      methodology: maintenance.methodology,
    },
  });

  for (const item of maintenance.hotspots ?? []) {
    chunks.push({
      id: `maintenance-measure::${item.table}::${item.name}`,
      type: 'maintenance_hotspot',
      text: [
        `Maintenance attention: ${item.table}[${item.name}].`,
        `Attention indicator: ${formatPercent(item.score)} (${item.band}).`,
        `Structural importance: ${formatPercent(item.evidence?.structuralImportance)}.`,
        `DAX complexity: ${formatPercent(item.evidence?.daxComplexity)}.`,
        `Dependency count: ${item.evidence?.dependencyCount ?? 0}.`,
        `Technical description present: ${Boolean(item.evidence?.technicalDescriptionPresent)}.`,
        `Business definition present: ${Boolean(item.evidence?.businessDefinitionPresent)}.`,
        item.reasons?.length ? `Reasons: ${item.reasons.join(', ')}.` : 'No high-attention reason crossed its explicit threshold.',
        'This indicator prioritizes maintenance review; it is not a quality score and does not imply a defect.',
      ].join('\n'),
      metadata: item,
    });
  }

  return chunks;
}

export function renderExtendedRagJsonl(profile) {
  return `${buildExtendedRagChunks(profile)
    .map((chunk) => JSON.stringify(chunk))
    .join('\n')}\n`;
}

function formatPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 'not available';
  }
  return `${Math.round(numeric * 1000) / 10}%`;
}
