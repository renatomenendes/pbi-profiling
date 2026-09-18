import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

test('Windows PBIX launcher is open-only and zero-install', () => {
  const source = readFileSync(
    resolve(
      'scripts/windows/open-pbix.ps1',
    ),
    'utf-8',
  );

  assert.match(
    source,
    /PBIDesktop\.exe/,
  );
  assert.match(
    source,
    /Start-Process/,
  );
  assert.match(
    source,
    /PBI_PROFILING_PBIX/,
  );

  assert.doesNotMatch(
    source,
    /TmdlSerializer/,
  );
  assert.doesNotMatch(
    source,
    /AnalysisServicesWorkspaces/,
  );
  assert.doesNotMatch(
    source,
    /SerializeDatabaseToFolder/,
  );
  assert.doesNotMatch(
    source,
    /Save As is not required/i,
  );

  assert.equal(
    /(?:^|\s)python(?:\.exe)?\s+/im.test(
      source,
    ),
    false,
  );
  assert.equal(
    /npm\s+(?:install|ci)(?:\s|$)/i.test(
      source,
    ),
    false,
  );
  assert.equal(
    /-ExecutionPolicy\s+(?:Bypass|Unrestricted)/i.test(
      source,
    ),
    false,
  );
});
