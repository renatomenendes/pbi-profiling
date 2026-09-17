import assert from 'node:assert/strict';
import test from 'node:test';

import { buildUsageProfile } from '../src/profile/usage.js';

const viewerModel = {
  tables: [
    { name: 'Measures' },
    { name: 'Fact' },
  ],
  measures: [
    {
      table: 'Measures',
      name: 'Total',
      dependsOn: {
        measures: ['Measures[Base]'],
        columns: ['Fact[Amount]'],
      },
    },
    {
      table: 'Measures',
      name: 'Base',
      dependsOn: {
        measures: [],
        columns: ['Fact[Amount]'],
      },
    },
    {
      table: 'Measures',
      name: 'Unused',
      dependsOn: {
        measures: [],
        columns: [],
      },
    },
  ],
  columns: [
    { table: 'Fact', name: 'Amount' },
    { table: 'Fact', name: 'Site' },
  ],
  visuals: [
    {
      key: 'report/page/visual-1',
      page: 'page',
      fields: [
        {
          kind: 'measure',
          table: 'Measures',
          name: 'Total',
          role: 'Values',
          via: 'query',
        },
      ],
    },
    {
      key: 'report/page/visual-2',
      page: 'page',
      fields: [
        {
          kind: 'column',
          table: 'Fact',
          name: 'Site',
          role: 'Category',
          via: 'query',
        },
      ],
    },
  ],
};

test('usage distinguishes direct, transitive, and unused objects', () => {
  const usage = buildUsageProfile(viewerModel);

  const total = usage.measures.find((item) => item.name === 'Total');
  const base = usage.measures.find((item) => item.name === 'Base');
  const unused = usage.measures.find((item) => item.name === 'Unused');
  const amount = usage.columns.find((item) => item.name === 'Amount');
  const site = usage.columns.find((item) => item.name === 'Site');

  assert.equal(total.visualReferences, 1);
  assert.equal(total.pageReferences, 1);
  assert.deepEqual(total.roles, ['Values']);
  assert.equal(total.active, true);

  assert.equal(base.visualReferences, 0);
  assert.equal(base.referencedByMeasures, 1);
  assert.equal(base.active, true);

  assert.equal(unused.active, false);
  assert.deepEqual(
    usage.unusedMeasures.map((item) => item.name),
    ['Unused'],
  );

  assert.equal(amount.referencedByMeasures, 2);
  assert.equal(amount.active, true);
  assert.equal(site.visualReferences, 1);
});
