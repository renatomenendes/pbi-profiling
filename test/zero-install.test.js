import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { buildLineageGraph, renderLineageHtml } from '../src/report/lineage.js';

test('package has no npm runtime or development dependencies', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));

  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.devDependencies, undefined);
});

test('dependency-free lineage renderer builds a self-contained interactive graph', () => {
  const profile = {
    meta: {
      projectName: 'Sample',
      modelName: 'Sample.SemanticModel',
      reportName: 'Sample.Report',
    },
    sourceResolution: {
      tables: [
        {
          table: 'Fact',
          level: 'physical-table',
          scope: 'external',
        },
      ],
    },
    semanticModel: {
      tables: [
        {
          name: 'Fact',
          kind: 'table',
          columnCount: 2,
          measureCount: 1,
          physicalPath: 'sql://server/database/dbo.Fact',
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
    },
    report: {
      pages: [
        {
          id: 'page-1',
          name: 'Overview',
          isHidden: false,
        },
      ],
      visuals: [
        {
          id: 'visual-1',
          page: 'page-1',
          fields: [
            {
              kind: 'measure',
              table: 'Fact',
              name: 'Total',
            },
          ],
        },
      ],
    },
  };

  const graph = buildLineageGraph(profile);
  const html = renderLineageHtml(profile);

  assert.ok(graph.nodes.some((node) => node.kind === 'source'));
  assert.ok(graph.nodes.some((node) => node.id === 'table:Fact'));
  assert.ok(graph.nodes.some((node) => node.id === 'measure:Fact[Total]'));
  assert.ok(graph.nodes.some((node) => node.id === 'page:page-1'));
  assert.ok(graph.edges.some((edge) => edge.type === 'source-table'));
  assert.ok(graph.edges.some((edge) => edge.type === 'column-dependency'));
  assert.ok(graph.edges.some((edge) => edge.type === 'measure-page'));
  assert.match(html, /id="payload"/);
  assert.match(html, /Lineage técnico/);
  assert.equal(html.includes('<script src='), false);
  assert.equal(html.includes('https://registry.npmjs.org'), false);
});

test('lineage renderer handles Web resource objects without string coercion', () => {
  const profile = {
    meta: {
      projectName: 'WebSample',
      modelName: 'WebSample.SemanticModel',
      reportName: 'WebSample.Report',
    },
    sourceResolution: {
      tables: [
        {
          table: 'WebFact',
          level: 'resource',
          scope: 'external',
        },
      ],
    },
    semanticModel: {
      tables: [
        {
          name: 'WebFact',
          kind: 'table',
          columnCount: 2,
          measureCount: 0,
          physicalPath: null,
          physical: {
            system: 'Web',
            url: 'https://example.invalid/data.parquet',
            table: null,
          },
        },
      ],
      measures: [],
      relationships: [],
    },
    report: {
      pages: [],
      visuals: [],
    },
  };

  const graph = buildLineageGraph(profile);
  const html = renderLineageHtml(profile);
  const source = graph.nodes.find((node) => node.kind === 'source');

  assert.equal(source.label, 'Web');
  assert.equal(source.subtitle, 'recurso Web');
  assert.match(source.description, /recurso/);
  assert.equal(html.includes('[object Object]'), false);
  assert.equal(html.includes('example.invalid'), false);
  assert.ok(graph.edges.some((edge) => edge.type === 'source-table'));
});
