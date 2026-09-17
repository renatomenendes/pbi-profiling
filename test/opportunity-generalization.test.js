import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAnalyticalProfile } from '../src/profile/analytical.js';
import { buildUsageProfile } from '../src/profile/usage.js';
import { renderIntelligenceSection } from '../src/report/intelligence.js';

function model() {
  return {
    tables: [{ name: 'Fact', kind: 'table' }],
    columns: [
      { table: 'Fact', name: 'ObservedAt', dataType: 'dateTime' },
      { table: 'Fact', name: 'EntityKey', dataType: 'string' },
      { table: 'Fact', name: 'Status', dataType: 'string' },
      { table: 'Fact', name: 'DurationHours', dataType: 'double' },
      { table: 'Fact', name: 'Value', dataType: 'double' },
      { table: 'Fact', name: 'UpdatedAt', dataType: 'dateTime' },
    ],
    measures: [],
    relationships: [
      {
        fromTable: 'Fact',
        fromColumn: 'EntityKey',
        toTable: 'DimEntity',
        toColumn: 'EntityKey',
      },
    ],
    visuals: [
      {
        id: 'v1',
        key: 'report/p1/v1',
        page: 'p1',
        type: 'lineChart',
        fields: [
          {
            kind: 'column',
            table: 'Fact',
            name: 'ObservedAt',
            role: 'Axis',
            via: 'query',
            ref: 'column:Fact[ObservedAt]',
          },
          {
            kind: 'column',
            table: 'Fact',
            name: 'EntityKey',
            role: 'Legend',
            via: 'query',
            ref: 'column:Fact[EntityKey]',
          },
          {
            kind: 'column',
            table: 'Fact',
            name: 'Value',
            role: 'Values',
            via: 'query',
            ref: 'column:Fact[Value]',
          },
        ],
      },
    ],
  };
}

test('opportunity catalog spans multiple analytical families', () => {
  const viewerModel = model();
  const analytical = buildAnalyticalProfile(
    viewerModel,
    buildUsageProfile(viewerModel),
  );
  const families = new Set(
    analytical.opportunities.map((item) => item.family),
  );
  const ids = new Set(
    analytical.opportunities.map((item) => item.id),
  );

  assert.ok(families.has('descriptive'));
  assert.ok(families.has('process-behavior'));
  assert.ok(families.has('diagnostic'));
  assert.ok(families.has('data-operations'));
  assert.ok(families.has('baseline-modeling'));
  assert.ok(families.has('forecasting'));
  assert.ok(families.has('anomaly-detection'));
  assert.ok(ids.has('trend-analysis'));
  assert.ok(ids.has('peer-comparison-analysis'));
  assert.ok(ids.has('forecasting-candidate'));
  assert.ok(ids.has('point-anomaly'));
  assert.match(
    analytical.methodology.opportunityPolicy,
    /Anomaly detection is one family/i,
  );
});

test('runbook presents opportunity families explicitly', () => {
  const viewerModel = model();
  const analytical = buildAnalyticalProfile(
    viewerModel,
    buildUsageProfile(viewerModel),
  );
  const profile = {
    complexity: {
      combined: { score: 0.1, band: 'low' },
      semanticModel: { score: 0.1, band: 'low' },
      report: { score: 0.1, band: 'low' },
      hotspots: [],
      methodology: {},
    },
    importance: {
      mostCentralMeasures: [],
      mostCentralTables: [],
      methodology: {},
    },
    analytical,
  };

  const html = renderIntelligenceSection(profile);

  assert.match(html, /Família/);
  assert.match(html, /Descritiva/);
  assert.match(html, /Diagnóstico/);
  assert.match(html, /Previsão/);
  assert.match(html, /Anomalias/);
  assert.match(html, /não assume que anomaly detection/i);
});
