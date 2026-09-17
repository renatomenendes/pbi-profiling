import assert from 'node:assert/strict';
import test from 'node:test';

import { buildExtendedRagChunks } from '../src/export/rag-extended.js';
import { renderSourceResolutionSection } from '../src/report/source-resolution.js';

const sourceResolution = {
  methodology: {
    caveat: 'Resource-level lineage is weaker than physical-column lineage.',
  },
  summary: {
    totalColumns: 50,
    traceableColumns: 46,
    physicalColumnResolved: 0,
    resourceResolved: 44,
    computedColumns: 4,
    modelDefinedColumns: 0,
    unresolvedColumns: 2,
    physicalColumnCoverage: 0,
    resourceLineageCoverage: 44 / 46,
    totalTables: 8,
    externalResourceTables: 4,
    inlineTables: 4,
    physicalTableTables: 0,
    resourceTables: 8,
    unresolvedTables: 0,
  },
  tables: [
    {
      table: 'FactWeb',
      system: 'Web',
      level: 'resource',
      scope: 'external',
      locatorKinds: ['url'],
    },
  ],
  columns: [],
};

test('source resolution section explains both coverage levels without conflating them', () => {
  const html = renderSourceResolutionSection({ sourceResolution });

  assert.match(html, /id="source-resolution"/);
  assert.match(html, /Lineage até recurso/);
  assert.match(html, /Lineage até coluna física/);
  assert.match(html, /95[,.]7%/);
  assert.match(html, /0[,.]0%/);
  assert.match(html, /FactWeb/);
  assert.match(html, /Web/);
});

test('extended RAG exposes source resolution as an auditable chunk', () => {
  const profile = {
    meta: { projectName: 'Project' },
    sourceResolution,
    maintenance: null,
    overview: { counts: {} },
    report: { pages: [], visuals: [] },
    semanticModel: {
      tables: [],
      columns: [],
      measures: [],
      relationships: [],
      sources: [],
    },
    usage: { measures: [], tables: [], unusedMeasures: [], unusedColumns: [] },
    importance: { measures: [], tables: [] },
    complexity: { measures: [] },
    analytical: { opportunities: [] },
    context: {
      status: 'not-provided',
      source: null,
      data: { dashboard: {}, tables: {}, measures: {}, pages: {}, sources: {} },
    },
    health: { findings: [], counts: {}, sourceResolutionCoverage: 0 },
  };

  const chunks = buildExtendedRagChunks(profile);
  const chunk = chunks.find((item) => item.type === 'source_resolution');

  assert.ok(chunk);
  assert.match(chunk.text, /Resource-lineage coverage: 95.7%/);
  assert.match(chunk.text, /Physical-column coverage: 0%/);
  assert.equal(chunk.metadata.summary.unresolvedColumns, 2);
});
