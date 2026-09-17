import assert from 'node:assert/strict';
import test from 'node:test';

import { buildExtendedRagChunks } from '../src/export/rag-extended.js';
import { renderSourceResolutionSection } from '../src/report/source-resolution.js';

const sourceResolution = {
  methodology: {
    inlinePolicy:
      'Inline/model-local columns are excluded from external-source coverage.',
    caveat: 'Resource-level lineage is weaker than physical-column lineage.',
  },
  summary: {
    totalColumns: 50,
    traceableColumns: 31,
    physicalColumnResolved: 0,
    resourceResolved: 31,
    inlineColumns: 15,
    computedColumns: 4,
    modelDefinedColumns: 0,
    unresolvedColumns: 0,
    physicalColumnCoverage: 0,
    resourceLineageCoverage: 1,
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
    {
      table: 'Lookup',
      system: 'Inline Literal',
      level: 'resource',
      scope: 'inline',
      locatorKinds: [],
    },
  ],
  columns: [],
};

test('source resolution section separates external and inline lineage', () => {
  const html = renderSourceResolutionSection({ sourceResolution });

  assert.match(html, /id="source-resolution"/);
  assert.match(html, /Lineage externo até recurso/);
  assert.match(html, /Lineage externo até coluna física/);
  assert.match(html, /100[,.]0%/);
  assert.match(html, /0[,.]0%/);
  assert.match(html, /15/);
  assert.match(html, /Inline\/modelo/);
  assert.match(html, /FactWeb/);
  assert.match(html, /Lookup/);
});

test('extended RAG exposes external and inline source resolution as an auditable chunk', () => {
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
  assert.match(chunk.text, /External resource-lineage coverage: 100%/);
  assert.match(chunk.text, /External physical-column coverage: 0%/);
  assert.match(chunk.text, /Inline\/model-local columns: 15/);
  assert.equal(chunk.metadata.summary.unresolvedColumns, 0);
});
