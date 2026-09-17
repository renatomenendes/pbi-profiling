import assert from 'node:assert/strict';
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  loadProfilingConfig,
  validateAndNormalizeProfilingConfig,
} from '../src/config/load.js';
import { buildAnalyticalProfile } from '../src/profile/analytical.js';
import { buildUsageProfile } from '../src/profile/usage.js';

function baseViewerModel(columns, visuals = [], relationships = []) {
  return {
    columns,
    visuals,
    relationships,
    measures: [],
    tables: [
      {
        name: 'Fact',
        kind: 'table',
      },
    ],
  };
}

function field(name, role) {
  return {
    kind: 'column',
    table: 'Fact',
    name,
    role,
    via: 'query',
    ref: `column:Fact[${name}]`,
  };
}

test('default semantics use structural evidence and do not embed pilot-domain nouns', () => {
  const model = baseViewerModel(
    [
      { table: 'Fact', name: 'ObservedAt', dataType: 'dateTime' },
      { table: 'Fact', name: 'Camera', dataType: 'string' },
      { table: 'Fact', name: 'Channel', dataType: 'string' },
      { table: 'Fact', name: 'Amount', dataType: 'double' },
    ],
    [
      {
        id: 'visual-1',
        key: 'report/page/visual-1',
        page: 'page',
        type: 'lineChart',
        fields: [
          field('ObservedAt', 'Axis'),
          field('Channel', 'Legend'),
          field('Amount', 'Values'),
        ],
      },
    ],
  );

  const usage = buildUsageProfile(model);
  const analytical = buildAnalyticalProfile(model, usage);

  assert.ok(
    analytical.signals.temporalColumns.some(
      (item) => item.name === 'ObservedAt' && item.evidence.includes('data-type:temporal'),
    ),
  );
  assert.ok(
    analytical.signals.entityColumns.some(
      (item) => item.name === 'Channel' && item.evidence.includes('visual-grouping-role'),
    ),
  );
  assert.equal(
    analytical.signals.entityColumns.some((item) => item.name === 'Camera'),
    false,
  );
  assert.equal(
    analytical.methodology.semanticConfiguration.status,
    'not-provided',
  );
  assert.equal(
    analytical.methodology.semanticConfiguration.customTermCount,
    0,
  );
});

test('generic semantics work across a sales-style model without domain configuration', () => {
  const model = baseViewerModel(
    [
      { table: 'Fact', name: 'OrderDate', dataType: 'dateTime' },
      { table: 'Fact', name: 'CustomerKey', dataType: 'string' },
      { table: 'Fact', name: 'Segment', dataType: 'string' },
      { table: 'Fact', name: 'Revenue', dataType: 'currency' },
    ],
    [
      {
        id: 'visual-sales',
        key: 'report/page/visual-sales',
        page: 'page',
        type: 'lineChart',
        fields: [
          field('OrderDate', 'Axis'),
          field('Segment', 'Legend'),
          field('Revenue', 'Values'),
        ],
      },
    ],
    [
      {
        fromTable: 'Fact',
        fromColumn: 'CustomerKey',
        toTable: 'DimCustomer',
        toColumn: 'CustomerKey',
      },
    ],
  );

  const usage = buildUsageProfile(model);
  const analytical = buildAnalyticalProfile(model, usage);

  assert.ok(analytical.signals.temporalColumns.some((item) => item.name === 'OrderDate'));
  assert.ok(analytical.signals.numericColumns.some((item) => item.name === 'Revenue'));
  assert.ok(analytical.signals.entityColumns.some((item) => item.name === 'CustomerKey'));
  assert.ok(analytical.signals.entityColumns.some((item) => item.name === 'Segment'));

  const point = analytical.opportunities.find((item) => item.id === 'point-anomaly');
  const contextual = analytical.opportunities.find((item) => item.id === 'contextual-anomaly');

  assert.notEqual(point.status, 'insufficient-structural-evidence');
  assert.notEqual(contextual.status, 'insufficient-structural-evidence');
});

test('generic semantics also recognize lifecycle and duration patterns outside the pilot domain', () => {
  const model = baseViewerModel([
    { table: 'Fact', name: 'SnapshotDate', dataType: 'dateTime' },
    { table: 'Fact', name: 'EmploymentStage', dataType: 'string' },
    { table: 'Fact', name: 'TenureDays', dataType: 'double' },
    { table: 'Fact', name: 'EmployeeKey', dataType: 'string' },
  ]);

  const usage = buildUsageProfile(model);
  const analytical = buildAnalyticalProfile(model, usage);

  assert.ok(analytical.signals.temporalColumns.some((item) => item.name === 'SnapshotDate'));
  assert.ok(analytical.signals.stateColumns.some((item) => item.name === 'EmploymentStage'));
  assert.ok(analytical.signals.durationColumns.some((item) => item.name === 'TenureDays'));
  assert.ok(analytical.signals.entityColumns.some((item) => item.name === 'EmployeeKey'));
});

test('optional semantic configuration adds domain vocabulary without changing the engine', () => {
  const model = baseViewerModel([
    { table: 'Fact', name: 'ObservedAt', dataType: 'dateTime' },
    { table: 'Fact', name: 'Camera', dataType: 'string' },
    { table: 'Fact', name: 'OperatingMode', dataType: 'string' },
  ]);
  const usage = buildUsageProfile(model);
  const config = {
    status: 'provided',
    source: 'pbi-profiling.config.json',
    data: {
      schemaVersion: 1,
      analysis: {
        semanticHints: {
          mode: 'extend',
          terms: {
            temporal: [],
            state: ['mode'],
            duration: [],
            entity: ['camera'],
            freshness: [],
          },
          columns: {},
        },
      },
    },
    warnings: [],
  };

  const analytical = buildAnalyticalProfile(model, usage, config);
  const camera = analytical.signals.entityColumns.find((item) => item.name === 'Camera');
  const mode = analytical.signals.stateColumns.find((item) => item.name === 'OperatingMode');

  assert.ok(camera);
  assert.ok(camera.evidence.includes('custom-semantic-term'));
  assert.ok(mode);
  assert.ok(mode.evidence.includes('custom-semantic-term'));
  assert.equal(analytical.methodology.semanticConfiguration.status, 'provided');
  assert.equal(analytical.methodology.semanticConfiguration.customTermCount, 2);
});

test('explicit column hints are auditable and can replace the default lexicon', () => {
  const model = baseViewerModel([
    { table: 'Fact', name: 'X1', dataType: 'string' },
    { table: 'Fact', name: 'Date', dataType: 'string' },
  ]);
  const usage = buildUsageProfile(model);
  const config = {
    status: 'provided',
    source: 'custom.json',
    data: {
      schemaVersion: 1,
      analysis: {
        semanticHints: {
          mode: 'replace',
          terms: {
            temporal: [],
            state: [],
            duration: [],
            entity: [],
            freshness: [],
          },
          columns: {
            'Fact[X1]': ['state'],
          },
        },
      },
    },
    warnings: [],
  };

  const analytical = buildAnalyticalProfile(model, usage, config);
  const x1 = analytical.signals.stateColumns.find((item) => item.name === 'X1');

  assert.ok(x1);
  assert.deepEqual(x1.evidence, ['explicit-column-hint']);
  assert.equal(x1.confidence, 'high');
  assert.equal(
    analytical.signals.temporalColumns.some((item) => item.name === 'Date'),
    false,
  );
  assert.equal(analytical.methodology.semanticConfiguration.mode, 'replace');
});

test('profiling config is strict, normalized and auto-loadable', () => {
  const normalized = validateAndNormalizeProfilingConfig({
    schemaVersion: 1,
    analysis: {
      semanticHints: {
        mode: 'extend',
        terms: {
          state: [' mode ', 'phase'],
        },
        columns: {
          'Fact[Code]': ['entity'],
        },
      },
    },
  });

  assert.deepEqual(normalized.data.analysis.semanticHints.terms.state, ['mode', 'phase']);
  assert.deepEqual(normalized.data.analysis.semanticHints.columns['Fact[Code]'], ['entity']);
  assert.throws(
    () => validateAndNormalizeProfilingConfig({
      schemaVersion: 1,
      analysis: { unsupported: true },
    }),
    /Unsupported field/,
  );
  assert.throws(
    () => validateAndNormalizeProfilingConfig({
      schemaVersion: 1,
      analysis: {
        semanticHints: {
          columns: { 'Fact[Code]': ['unknown'] },
        },
      },
    }),
    /Unsupported semantic category/,
  );

  const root = mkdtempSync(join(tmpdir(), 'pbi-profiling-config-'));
  try {
    writeFileSync(
      join(root, 'pbi-profiling.config.json'),
      JSON.stringify({
        schemaVersion: 1,
        analysis: {
          semanticHints: {
            terms: { state: ['mode'] },
          },
        },
      }),
      'utf-8',
    );

    const loaded = loadProfilingConfig(root);
    assert.equal(loaded.status, 'provided');
    assert.equal(loaded.source, 'pbi-profiling.config.json');
    assert.deepEqual(loaded.data.analysis.semanticHints.terms.state, ['mode']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
