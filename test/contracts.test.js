import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

import { validateAndNormalizeContext } from '../src/context/load.js';
import { number, percent } from '../src/report/escape.js';

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(relativePath), 'utf-8'));
}

test('published JSON schemas are syntactically valid and aligned with profile v2', () => {
  const profileSchema = readJson('schemas/profile.schema.json');
  const contextSchema = readJson('schemas/pbi-profiling.context.schema.json');
  const configSchema = readJson('schemas/pbi-profiling.config.schema.json');
  const ragSchema = readJson('schemas/profile.rag.chunk.schema.json');

  assert.equal(profileSchema.properties.schemaVersion.const, 2);
  assert.ok(profileSchema.required.includes('maintenance'));
  assert.equal(contextSchema.properties.schemaVersion.const, 1);
  assert.equal(configSchema.properties.schemaVersion.const, 1);
  assert.deepEqual(
    configSchema.properties.analysis.properties.semanticHints.properties.mode.enum,
    ['extend', 'replace'],
  );
  assert.ok(ragSchema.properties.type.enum.includes('maintenance_overview'));
  assert.ok(ragSchema.properties.type.enum.includes('maintenance_hotspot'));
});

test('business context rejects unsupported fields instead of silently losing metadata', () => {
  assert.throws(
    () => validateAndNormalizeContext({
      schemaVersion: 1,
      measurs: {
        'Measures[Total]': {
          businessDefinition: 'Typo must not disappear silently.',
        },
      },
    }),
    /unsupported field\(s\): measurs/i,
  );

  assert.throws(
    () => validateAndNormalizeContext({
      schemaVersion: 1,
      dashboard: {
        refresCadence: 'hourly',
      },
    }),
    /dashboard contains unsupported field\(s\): refresCadence/i,
  );
});

test('missing numeric evidence is rendered as unavailable rather than zero', () => {
  assert.equal(number(null), '—');
  assert.equal(number(undefined), '—');
  assert.equal(percent(null), '—');
  assert.equal(percent(undefined), '—');
  assert.equal(percent(0), '0%');
});
