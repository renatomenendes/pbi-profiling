import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

test('Windows PBIX adapter preserves zero-install and official TOM serialization contracts', () => {
  const path = resolve(
    'scripts/windows/convert-pbix.ps1',
  );
  const source = readFileSync(
    path,
    'utf-8',
  );

  assert.match(
    source,
    /TmdlSerializer.*SerializeDatabaseToFolder/s,
  );
  assert.match(
    source,
    /Report\/definition\//,
  );
  assert.match(
    source,
    /AnalysisServicesWorkspaces/,
  );
  assert.match(
    source,
    /Power BI Desktop/,
  );

  assert.equal(
    /python|pythonnet|pip install/i.test(source),
    false,
  );
  assert.equal(
    /npm install|npm ci/i.test(source),
    false,
  );
  assert.equal(
    /ExecutionPolicy|Bypass/i.test(source),
    false,
  );
});

test('PBIX converter refuses legacy report layout instead of fabricating PBIR', () => {
  const source = readFileSync(
    resolve(
      'scripts/windows/convert-pbix.ps1',
    ),
    'utf-8',
  );

  assert.match(
    source,
    /legacy Report\/Layout format/i,
  );
  assert.match(
    source,
    /refuses to approximate/i,
  );
});
