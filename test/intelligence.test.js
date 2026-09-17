import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAnalyticalProfile } from '../src/profile/analytical.js';
import { buildComplexityProfile } from '../src/profile/complexity.js';
import { buildContextProfile } from '../src/profile/context.js';
import { buildStructuralImportanceProfile } from '../src/profile/importance.js';
import { buildUsageProfile } from '../src/profile/usage.js';
import { renderRagJsonl } from '../src/export/rag.js';
import { validateAndNormalizeContext } from '../src/context/load.js';
import { renderEnhancedReportHtml } from '../src/report/enhance.js';

function viewerModel() {
  return {
    version: 3,
    meta: { generatedAt: '2026-09-17T12:00:00.000Z' },
    tables: [
      { name: 'Events', kind: 'table' },
      { name: 'Measures', kind: 'table' },
    ],
    columns: [
      { table: 'Events', name: 'EventDate', dataType: 'dateTime', confidence: 'exact' },
      { table: 'Events', name: 'Site', dataType: 'string', confidence: 'exact' },
      { table: 'Events', name: 'Status', dataType: 'string', confidence: 'exact' },
      { table: 'Events', name: 'DurationHours', dataType: 'double', confidence: 'exact' },
      { table: 'Events', name: 'Value', dataType: 'double', confidence: 'exact' },
      { table: 'Events', name: 'UpdatedAt', dataType: 'dateTime', confidence: 'exact' },
    ],
    measures: [
      {
        table: 'Measures',
        name: 'Base Value',
        expression: 'SUM(Events[Value])',
        dependsOn: { measures: [], columns: ['Events[Value]'], tables: [] },
      },
      {
        table: 'Measures',
        name: 'Value MTD',
        expression: `
VAR CurrentValue = [Base Value]
RETURN
    CALCULATE(
        CurrentValue,
        DATESMTD(Events[EventDate]),
        FILTER(ALL(Events), Events[Status] <> "Ignored")
    )`,
        dependsOn: {
          measures: ['Measures[Base Value]'],
          columns: ['Events[EventDate]', 'Events[Status]'],
          tables: ['Events'],
        },
      },
      {
        table: 'Measures',
        name: 'Unused',
        expression: '1',
        dependsOn: { measures: [], columns: [], tables: [] },
      },
    ],
    relationships: [
      {
        fromTable: 'Events',
        fromColumn: 'Site',
        toTable: 'Measures',
        toColumn: 'Site',
        isActive: true,
      },
    ],
    sources: [
      {
        ref: 'source:events',
        type: 'Parquet.Document',
        path: 'events.parquet',
      },
    ],
    pages: [
      { id: 'p1', name: 'Operations', order: 0, visualCount: 2 },
      { id: 'p2', name: 'Detail', order: 1, visualCount: 1 },
    ],
    visuals: [
      {
        id: 'v1',
        key: 'report/p1/v1',
        page: 'p1',
        type: 'lineChart',
        fields: [
          { kind: 'column', table: 'Events', name: 'EventDate', role: 'Axis', via: 'query', ref: 'column:Events[EventDate]' },
          { kind: 'column', table: 'Events', name: 'Site', role: 'Legend', via: 'query', ref: 'column:Events[Site]' },
          { kind: 'measure', table: 'Measures', name: 'Value MTD', role: 'Values', via: 'query', ref: 'measure:Measures[Value MTD]' },
        ],
      },
      {
        id: 'v2',
        key: 'report/p1/v2',
        page: 'p1',
        type: 'tableEx',
        fields: [
          { kind: 'column', table: 'Events', name: 'Status', role: 'Values', via: 'query', ref: 'column:Events[Status]' },
          { kind: 'column', table: 'Events', name: 'DurationHours', role: 'Values', via: 'query', ref: 'column:Events[DurationHours]' },
        ],
      },
      {
        id: 'v3',
        key: 'report/p2/v3',
        page: 'p2',
        type: 'card',
        fields: [
          { kind: 'measure', table: 'Measures', name: 'Base Value', role: 'Values', via: 'query', ref: 'measure:Measures[Base Value]' },
        ],
      },
    ],
    bookmarks: [],
    reportMeasures: [],
    stats: { confidence: { coverage: 1 } },
  };
}

test('complexity exposes transparent components and identifies the more complex DAX', () => {
  const result = buildComplexityProfile(viewerModel());
  const complex = result.measures.find((item) => item.name === 'Value MTD');
  const simple = result.measures.find((item) => item.name === 'Unused');

  assert.ok(complex.score > simple.score);
  assert.ok(complex.metrics.variables > 0);
  assert.ok(complex.metrics.nestingDepth > 0);
  assert.ok(complex.patterns.timeIntelligence.includes('DATESMTD'));
  assert.equal(result.methodology.measureFormula.expressionLength.weight, 0.25);
});

test('structural importance distinguishes centrality from business value', () => {
  const model = viewerModel();
  const usage = buildUsageProfile(model);
  const result = buildStructuralImportanceProfile(model, usage);
  const base = result.measures.find((item) => item.name === 'Base Value');
  const unused = result.measures.find((item) => item.name === 'Unused');

  assert.ok(base.score > unused.score);
  assert.equal(base.evidence.directDependentMeasures, 1);
  assert.match(result.methodology.scope, /not business value/i);
});

test('analytical profiling keeps opportunities evidence-backed and caveated', () => {
  const model = viewerModel();
  const usage = buildUsageProfile(model);
  const result = buildAnalyticalProfile(model, usage);

  assert.ok(result.signals.temporalColumns.some((item) => item.name === 'EventDate'));
  assert.ok(result.signals.stateColumns.some((item) => item.name === 'Status'));
  assert.ok(result.signals.entityColumns.some((item) => item.name === 'Site'));
  assert.ok(result.signals.durationColumns.some((item) => item.name === 'DurationHours'));

  const transition = result.opportunities.find(
    (item) => item.id === 'state-transition-monitoring',
  );
  assert.notEqual(transition.status, 'insufficient-structural-evidence');
  assert.match(transition.caveat, /not evidence/i);
});

test('business context is validated, normalized and resolved against PBIP objects', () => {
  const normalized = validateAndNormalizeContext({
    schemaVersion: 1,
    dashboard: {
      purpose: 'Operational monitoring',
      audience: ['Operations'],
      refresh: { cadence: 'hourly', sla: '90 minutes' },
    },
    tables: {
      Events: { grain: 'Site x EventDate', businessMeaning: 'Status history' },
      Missing: { grain: 'unknown' },
    },
    measures: {
      'Measures[Base Value]': { businessDefinition: 'Observed value' },
    },
  });

  const context = buildContextProfile(
    {
      status: 'provided',
      source: 'pbi-profiling.context.json',
      ...normalized,
    },
    viewerModel(),
    [
      { id: 'p1', name: 'Operations' },
      { id: 'p2', name: 'Detail' },
    ],
  );

  assert.equal(context.status, 'provided');
  assert.equal(context.data.dashboard.purpose, 'Operational monitoring');
  assert.deepEqual(context.unmatched.tables, ['Missing']);
  assert.ok(context.warnings.some((warning) => warning.includes('Missing')));
});

test('RAG JSONL contains self-contained profile and analytical chunks', () => {
  const model = viewerModel();
  const usage = buildUsageProfile(model);
  const complexity = buildComplexityProfile(model);
  const importance = buildStructuralImportanceProfile(model, usage);
  const analytical = buildAnalyticalProfile(model, usage);
  const profile = {
    meta: { projectName: 'Project', modelName: 'Model', reportName: 'Report' },
    overview: {
      counts: { pages: 2, visuals: 3, tables: 2, columns: 6, measures: 3, relationships: 1, sources: 1 },
    },
    report: { pages: model.pages, visuals: model.visuals },
    semanticModel: {
      tables: model.tables,
      columns: model.columns,
      measures: model.measures,
      relationships: model.relationships,
      sources: model.sources,
    },
    usage,
    complexity,
    importance,
    analytical,
    context: {
      status: 'not-provided',
      source: null,
      data: { dashboard: {}, tables: {}, measures: {}, pages: {}, sources: {} },
    },
    health: { sourceResolutionCoverage: 1, counts: { warnings: 0, info: 0, errors: 0 }, findings: [] },
  };

  const lines = renderRagJsonl(profile).trim().split('\n').map(JSON.parse);
  const types = new Set(lines.map((line) => line.type));

  assert.ok(types.has('overview'));
  assert.ok(types.has('table'));
  assert.ok(types.has('measure'));
  assert.ok(types.has('report_page'));
  assert.ok(types.has('analytical_opportunity'));
  assert.ok(lines.every((line) => line.id && line.text && line.metadata));
});

test('enhanced runbook adds context and intelligence while remaining self-contained', () => {
  const model = viewerModel();
  const usage = buildUsageProfile(model);
  const profile = {
    schemaVersion: 2,
    meta: {
      projectName: 'Project',
      modelName: 'Model',
      reportName: 'Report',
      generatedAt: '2026-09-17T12:00:00.000Z',
      engine: { name: '@pbi-lineage-lenz/core', viewerModelVersion: 3 },
    },
    overview: {
      counts: { pages: 2, visuals: 3, tables: 2, columns: 6, measures: 3, relationships: 1, sources: 1, bookmarks: 0, reportMeasures: 0 },
      hiddenPages: 0,
      sourceResolutionCoverage: 1,
    },
    report: { pages: model.pages, visuals: model.visuals, bookmarks: [], reportMeasures: [] },
    semanticModel: {
      tables: model.tables,
      columns: model.columns,
      measures: model.measures,
      relationships: model.relationships,
      sources: model.sources,
    },
    usage,
    complexity: buildComplexityProfile(model),
    importance: buildStructuralImportanceProfile(model, usage),
    analytical: buildAnalyticalProfile(model, usage),
    context: {
      status: 'not-provided',
      source: null,
      data: { dashboard: {}, tables: {}, measures: {}, pages: {}, sources: {}, notes: [] },
      coverage: { dashboard: 0, objects: {} },
      warnings: [],
    },
    health: { sourceResolutionCoverage: 1, findings: [], counts: { warnings: 0, info: 0, errors: 0 } },
    engineStats: {},
  };

  const html = renderEnhancedReportHtml({ profile, lineageHtml: '<html>lineage</html>' });
  assert.match(html, /id="context"/);
  assert.match(html, /id="intelligence"/);
  assert.match(html, /href="#context"/);
  assert.match(html, /href="#intelligence"/);
  assert.equal(html.includes('<script src='), false);
});
