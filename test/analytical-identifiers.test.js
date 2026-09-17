import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAnalyticalProfile } from '../src/profile/analytical.js';
import { buildUsageProfile } from '../src/profile/usage.js';

function modelWithNamingConventions() {
  return {
    tables: [{ name: 'Events', kind: 'table' }],
    columns: [
      { table: 'Events', name: 'EventDate', dataType: 'dateTime' },
      { table: 'Events', name: 'DurationHours', dataType: 'double' },
      { table: 'Events', name: 'UpdatedAt', dataType: 'dateTime' },
      { table: 'Events', name: 'SiteId', dataType: 'string' },
      { table: 'Events', name: 'offline_duration_hours', dataType: 'double' },
      { table: 'Events', name: 'Status-Camera', dataType: 'string' },
    ],
    measures: [],
    relationships: [],
    sources: [],
    pages: [],
    visuals: [],
    bookmarks: [],
    reportMeasures: [],
  };
}

test('analytical identifiers support CamelCase, snake_case and punctuation without substring matching', () => {
  const model = modelWithNamingConventions();
  const result = buildAnalyticalProfile(model, buildUsageProfile(model));

  const names = (items) => new Set(items.map((item) => item.name));

  assert.ok(names(result.signals.temporalColumns).has('EventDate'));
  assert.ok(names(result.signals.durationColumns).has('DurationHours'));
  assert.ok(names(result.signals.durationColumns).has('offline_duration_hours'));
  assert.ok(names(result.signals.freshnessColumns).has('UpdatedAt'));
  assert.ok(names(result.signals.entityColumns).has('SiteId'));
  assert.ok(names(result.signals.stateColumns).has('Status-Camera'));

  assert.equal(
    result.methodology.identifierNormalization.includes('CamelCase'),
    true,
  );
});
