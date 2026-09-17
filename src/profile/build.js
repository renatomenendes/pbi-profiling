import { buildHealthProfile } from './health.js';
import { buildUsageProfile } from './usage.js';

export const PROFILE_SCHEMA_VERSION = 1;

export function buildProfile(engineResult) {
  const {
    analysis,
    note,
    pageMetadata,
    partition,
    projectName,
    viewerModel,
  } = engineResult;

  const usage = buildUsageProfile(viewerModel);
  const health = buildHealthProfile(
    viewerModel,
    usage,
    {
      pageMetadata,
      brokenReferences: analysis.graph?.brokenRefs ?? [],
    },
  );

  const pages = mergePages(
    viewerModel.pages ?? [],
    pageMetadata ?? [],
  );

  const visualTypes = countBy(
    viewerModel.visuals ?? [],
    (visual) => visual.type ?? 'unknown',
  );

  const tableKinds = countBy(
    viewerModel.tables ?? [],
    (table) => table.kind ?? 'table',
  );

  return {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    meta: {
      projectName,
      modelName: partition.modelName,
      reportName: partition.reportName,
      generatedAt: viewerModel.meta?.generatedAt ?? new Date().toISOString(),
      note: note ?? null,
      engine: {
        name: '@pbi-lineage-lenz/core',
        viewerModelVersion: viewerModel.version ?? null,
      },
    },
    overview: {
      counts: {
        tables: viewerModel.tables?.length ?? 0,
        columns: viewerModel.columns?.length ?? 0,
        measures: viewerModel.measures?.length ?? 0,
        relationships: viewerModel.relationships?.length ?? 0,
        sources: viewerModel.sources?.length ?? 0,
        pages: pages.length,
        visuals: viewerModel.visuals?.length ?? 0,
        bookmarks: viewerModel.bookmarks?.length ?? 0,
        reportMeasures: viewerModel.reportMeasures?.length ?? 0,
      },
      tableKinds,
      visualTypes,
      hiddenPages: pages.filter((page) => page.isHidden === true).length,
      hiddenVisuals: (viewerModel.visuals ?? []).filter(
        (visual) => visual.isHidden,
      ).length,
      neverShownVisuals: (viewerModel.visuals ?? []).filter(
        (visual) => visual.neverShown,
      ).length,
      sourceResolutionCoverage: health.sourceResolutionCoverage,
    },
    report: {
      pages,
      visuals: viewerModel.visuals ?? [],
      bookmarks: viewerModel.bookmarks ?? [],
      reportMeasures: viewerModel.reportMeasures ?? [],
    },
    semanticModel: {
      tables: viewerModel.tables ?? [],
      columns: viewerModel.columns ?? [],
      measures: viewerModel.measures ?? [],
      relationships: viewerModel.relationships ?? [],
      sources: viewerModel.sources ?? [],
    },
    usage,
    health,
    engineStats: sanitizeEngineStats(viewerModel.stats),
  };
}

function mergePages(pages, metadata) {
  const byId = new Map(
    metadata.map((page) => [page.id, page]),
  );

  const merged = pages.map((page) => {
    const enrichment = byId.get(page.id);

    return {
      ...page,
      visibility: enrichment?.visibility ?? null,
      isHidden: enrichment?.isHidden ?? false,
      pageType: enrichment?.pageType ?? null,
      sourcePath: enrichment?.sourcePath ?? null,
      parseError: enrichment?.parseError ?? null,
    };
  });

  const known = new Set(pages.map((page) => page.id));

  for (const page of metadata) {
    if (page.id && !known.has(page.id)) {
      merged.push({
        ref: null,
        key: null,
        id: page.id,
        name: page.name,
        order: page.ordinal ?? 0,
        width: page.width,
        height: page.height,
        visualCount: 0,
        visibility: page.visibility,
        isHidden: page.isHidden,
        pageType: page.pageType,
        sourcePath: page.sourcePath,
        parseError: page.parseError,
      });
    }
  }

  return merged.sort(
    (left, right) =>
      (left.order ?? 0) - (right.order ?? 0) ||
      left.name.localeCompare(right.name),
  );
}

function countBy(items, keySelector) {
  const counts = new Map();

  for (const item of items) {
    const key = keySelector(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Object.fromEntries(
    [...counts.entries()].sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
}

function sanitizeEngineStats(stats) {
  if (!stats) {
    return null;
  }

  return JSON.parse(JSON.stringify(stats));
}
