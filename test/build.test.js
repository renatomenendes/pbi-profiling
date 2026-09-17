import assert from 'node:assert/strict';
import test from 'node:test';

import { buildProfile } from '../src/profile/build.js';

function engineResult() {
  return {
    projectName: 'Sample',
    note: null,
    partition: {
      modelName: 'Sample.SemanticModel',
      reportName: 'Sample.Report',
    },
    pageMetadata: [
      {
        id: 'page-1',
        name: 'Overview',
        visibility: 'Visible',
        isHidden: false,
        pageType: null,
        width: 1280,
        height: 720,
        ordinal: 0,
        sourcePath: 'Sample.Report/definition/pages/page-1/page.json',
        parseError: null,
      },
    ],
    analysis: {
      graph: {
        brokenRefs: [],
      },
    },
    viewerModel: {
      version: 3,
      meta: {
        generatedAt: '2026-09-17T00:00:00.000Z',
        projectPath: 'C:/sensitive/local/path',
      },
      stats: {
        confidence: {
          coverage: 1,
        },
      },
      tables: [
        {
          name: 'Fact',
          kind: 'table',
        },
      ],
      columns: [
        {
          table: 'Fact',
          name: 'Amount',
          confidence: 'exact',
          sourceless: null,
        },
      ],
      measures: [
        {
          table: 'Fact',
          name: 'Total',
          expression: 'SUM(Fact[Amount])',
          dependsOn: {
            measures: [],
            columns: ['Fact[Amount]'],
          },
        },
      ],
      relationships: [],
      sources: [
        {
          type: 'Sql.Database',
          server: 'server',
          database: 'database',
        },
      ],
      pages: [
        {
          id: 'page-1',
          name: 'Overview',
          order: 0,
          visualCount: 1,
        },
      ],
      visuals: [
        {
          id: 'visual-1',
          key: 'report/page-1/visual-1',
          page: 'page-1',
          type: 'card',
          isHidden: false,
          neverShown: false,
          fields: [
            {
              kind: 'measure',
              table: 'Fact',
              name: 'Total',
              role: 'Values',
              via: 'query',
              ref: 'measure:Fact[Total]',
            },
          ],
        },
      ],
      bookmarks: [],
      reportMeasures: [],
    },
  };
}

test('profile is portable and preserves inspectable evidence', () => {
  const profile = buildProfile(engineResult());

  assert.equal(profile.schemaVersion, 1);
  assert.equal(profile.meta.projectName, 'Sample');
  assert.equal(profile.overview.counts.tables, 1);
  assert.equal(profile.overview.counts.measures, 1);
  assert.equal(profile.overview.counts.visuals, 1);
  assert.equal(profile.overview.sourceResolutionCoverage, 1);
  assert.equal(profile.report.pages[0].isHidden, false);
  assert.equal(profile.semanticModel.measures[0].expression, 'SUM(Fact[Amount])');
  assert.equal(profile.usage.measures[0].visualReferences, 1);
  assert.equal(profile.targetPath, undefined);
  assert.equal(JSON.stringify(profile).includes('C:/sensitive/local/path'), false);
});
