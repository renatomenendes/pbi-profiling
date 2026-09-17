import assert from 'node:assert/strict';
import test from 'node:test';

import { buildExtendedRagChunks } from '../src/export/rag-extended.js';
import { buildComplexityProfile } from '../src/profile/complexity.js';
import { buildStructuralImportanceProfile } from '../src/profile/importance.js';
import { buildMaintenanceProfile } from '../src/profile/maintenance.js';
import { buildUsageProfile } from '../src/profile/usage.js';
import { renderMaintenanceSection } from '../src/report/maintenance.js';

function viewerModel() {
  return {
    tables: [
      { name: 'Fact', kind: 'table' },
      { name: 'Measures', kind: 'table' },
    ],
    columns: [
      { table: 'Fact', name: 'Amount', dataType: 'double', confidence: 'exact' },
    ],
    measures: [
      {
        table: 'Measures',
        name: 'Core Metric',
        description: null,
        expression: `
VAR Base = SUM(Fact[Amount])
RETURN
  CALCULATE(
    Base,
    FILTER(ALL(Fact), Fact[Amount] > 0)
  )`,
        dependsOn: {
          measures: [],
          columns: ['Fact[Amount]'],
          tables: ['Fact'],
        },
      },
      {
        table: 'Measures',
        name: 'Consumer Metric',
        description: 'Derived metric.',
        expression: '[Core Metric] * 2',
        dependsOn: {
          measures: ['Measures[Core Metric]'],
          columns: [],
          tables: [],
        },
      },
      {
        table: 'Measures',
        name: 'Unused Metric',
        description: null,
        expression: '1',
        dependsOn: {
          measures: [],
          columns: [],
          tables: [],
        },
      },
    ],
    relationships: [],
    sources: [
      {
        ref: 'source:fact',
        type: 'Sql.Database',
        server: 'server',
        database: 'database',
        gatewayRequired: true,
        isNativeQuery: true,
        parameterized: false,
      },
    ],
    pages: [
      { id: 'p1', name: 'Overview' },
      { id: 'p2', name: 'Detail' },
    ],
    visuals: [
      {
        id: 'v1',
        page: 'p1',
        fields: [
          {
            kind: 'measure',
            table: 'Measures',
            name: 'Core Metric',
            ref: 'measure:Measures[Core Metric]',
          },
        ],
      },
      {
        id: 'v2',
        page: 'p2',
        fields: [
          {
            kind: 'measure',
            table: 'Measures',
            name: 'Consumer Metric',
            ref: 'measure:Measures[Consumer Metric]',
          },
        ],
      },
    ],
    bookmarks: [],
    reportMeasures: [],
  };
}

function emptyContext() {
  return {
    status: 'not-provided',
    source: null,
    data: {
      dashboard: {},
      tables: {},
      measures: {},
      pages: {},
      sources: {},
      notes: [],
    },
  };
}

test('maintenance attention prioritizes change surface and exposes its components', () => {
  const model = viewerModel();
  const usage = buildUsageProfile(model);
  const importance = buildStructuralImportanceProfile(model, usage);
  const complexity = buildComplexityProfile(model);
  const maintenance = buildMaintenanceProfile(model, {
    importance,
    complexity,
    context: emptyContext(),
    health: { findings: [] },
  });

  const core = maintenance.measures.find((item) => item.name === 'Core Metric');
  const unused = maintenance.measures.find((item) => item.name === 'Unused Metric');

  assert.ok(core.score > unused.score);
  assert.ok(core.evidence.structuralImportance > 0);
  assert.ok(core.evidence.daxComplexity > unused.evidence.daxComplexity);
  assert.equal(core.evidence.technicalDescriptionPresent, false);
  assert.ok(core.reasons.includes('documentation-gap'));
  assert.equal(maintenance.sourceDependencies.gatewayRequired.length, 1);
  assert.equal(maintenance.sourceDependencies.nativeQueries.length, 1);
  assert.match(maintenance.methodology.scope, /not a quality score/i);
});

test('maintenance output is visible in HTML and RAG without being labeled a defect', () => {
  const model = viewerModel();
  const usage = buildUsageProfile(model);
  const importance = buildStructuralImportanceProfile(model, usage);
  const complexity = buildComplexityProfile(model);
  const maintenance = buildMaintenanceProfile(model, {
    importance,
    complexity,
    context: emptyContext(),
    health: { findings: [] },
  });

  const profile = {
    meta: {
      projectName: 'Project',
      modelName: 'Model',
      reportName: 'Report',
    },
    overview: {
      counts: {
        pages: 2,
        visuals: 2,
        tables: 2,
        columns: 1,
        measures: 3,
        relationships: 0,
        sources: 1,
      },
    },
    report: { pages: model.pages, visuals: model.visuals },
    semanticModel: {
      tables: model.tables,
      columns: model.columns,
      measures: model.measures,
      relationships: [],
      sources: model.sources,
    },
    usage,
    importance,
    complexity,
    analytical: { opportunities: [] },
    context: emptyContext(),
    health: {
      sourceResolutionCoverage: 1,
      counts: { warnings: 0, info: 0, errors: 0 },
      findings: [],
    },
    maintenance,
  };

  const html = renderMaintenanceSection(profile);
  const chunks = buildExtendedRagChunks(profile);

  assert.match(html, /id="maintenance"/);
  assert.match(html, /não é uma nota de qualidade/i);
  assert.ok(chunks.some((chunk) => chunk.type === 'maintenance_overview'));
  assert.ok(chunks.some((chunk) => chunk.type === 'maintenance_hotspot'));
});
