import assert from 'node:assert/strict';
import test from 'node:test';

import { renderReportHtml } from '../src/report/render.js';

function sampleProfile() {
  return {
    schemaVersion: 1,
    meta: {
      projectName: 'Sample </script><script>alert(1)</script>',
      modelName: 'Sample.SemanticModel',
      reportName: 'Sample.Report',
      generatedAt: '2026-09-17T12:00:00.000Z',
      engine: {
        name: '@pbi-lineage-lenz/core',
        viewerModelVersion: 3,
      },
    },
    overview: {
      counts: {
        tables: 1,
        columns: 1,
        measures: 1,
        relationships: 0,
        sources: 0,
        pages: 1,
        visuals: 1,
        bookmarks: 0,
        reportMeasures: 0,
      },
      hiddenPages: 0,
      hiddenVisuals: 0,
      neverShownVisuals: 0,
      sourceResolutionCoverage: 1,
      tableKinds: { table: 1 },
      visualTypes: { card: 1 },
    },
    report: {
      pages: [
        {
          id: 'page-1',
          name: 'Overview',
          order: 0,
          width: 1280,
          height: 720,
          visualCount: 1,
          isHidden: false,
        },
      ],
      visuals: [
        {
          id: 'visual-1',
          key: 'report/page-1/visual-1',
          page: 'page-1',
          type: 'card',
          title: 'Total',
          position: {
            x: 40,
            y: 40,
            width: 300,
            height: 160,
          },
          isHidden: false,
          neverShown: false,
          fields: [
            {
              kind: 'measure',
              table: 'Measures',
              name: 'Total',
              role: 'Values',
              via: 'query',
              ref: 'measure:Measures[Total]',
            },
          ],
        },
      ],
      bookmarks: [],
      reportMeasures: [],
    },
    semanticModel: {
      tables: [
        {
          name: 'Measures',
          kind: 'table',
          columnCount: 0,
          measureCount: 1,
          steps: [],
        },
      ],
      columns: [],
      measures: [
        {
          table: 'Measures',
          name: 'Total',
          expression: '1 < 2 && "</script>" <> BLANK()',
          dependsOn: {
            measures: [],
            columns: [],
          },
        },
      ],
      relationships: [],
      sources: [],
    },
    usage: {
      measures: [
        {
          table: 'Measures',
          name: 'Total',
          visualReferences: 1,
          pageReferences: 1,
          referencedByMeasures: 0,
          active: true,
        },
      ],
      columns: [],
      tables: [
        {
          table: 'Measures',
          visualReferences: 1,
          pageReferences: 1,
          directlyUsedMeasures: 1,
          directlyUsedColumns: 0,
        },
      ],
      unusedMeasures: [],
      unusedColumns: [],
    },
    health: {
      sourceResolutionCoverage: 1,
      findings: [],
      counts: {
        warnings: 0,
        info: 0,
        errors: 0,
      },
    },
    engineStats: {},
  };
}

test('runbook is self-contained, navigable, and safe for embedded PBIP text', () => {
  const lineage = '<!doctype html><html><body>lineage</body></html>';
  const html = renderReportHtml({
    profile: sampleProfile(),
    lineageHtml: lineage,
  });

  for (const section of [
    'overview',
    'pages',
    'metrics',
    'data',
    'lineage',
    'usage',
    'quality',
    'technical',
  ]) {
    assert.match(html, new RegExp(`id="${section}"`));
  }

  assert.match(html, /class="page-wireframe"/);
  assert.match(html, /id="profile-payload"/);
  assert.match(html, /id="lineage-payload"/);
  assert.equal(html.includes('<script src='), false);
  assert.equal(html.includes('<link rel="stylesheet"'), false);
  assert.equal(html.includes('</script><script>alert(1)</script>'), false);
  assert.match(html, /\\u003c\/script\\u003e/);
  assert.match(
    html,
    new RegExp(Buffer.from(lineage, 'utf-8').toString('base64')),
  );
});
