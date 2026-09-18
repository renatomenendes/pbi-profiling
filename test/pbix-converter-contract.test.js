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
    /(?:^|\s)python(?:\.exe)?\s+/im.test(source),
    false,
  );
  assert.equal(
    /npm\s+(?:install|ci)(?:\s|$)/i.test(source),
    false,
  );
  assert.equal(
    /-ExecutionPolicy\s+(?:Bypass|Unrestricted)/i.test(source),
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


test('PBIX model detection correlates new Desktop model identity without relying on workspace timestamps alone', () => {
  const source = readFileSync(
    resolve(
      'scripts/windows/convert-pbix.ps1',
    ),
    'utf-8',
  );

  assert.match(
    source,
    /PreviousCandidates/,
  );
  assert.match(
    source,
    /Get-CandidateIdentity/,
  );
  assert.match(
    source,
    /isNewProcess/,
  );
  assert.match(
    source,
    /isRecentWorkspace/,
  );
  assert.doesNotMatch(
    source,
    /PreviousWorkspaces/,
  );
  assert.match(
    source,
    /No manual Save As is required/i,
  );
});


test('PBIX model discovery combines live msmdsrv TCP listeners with workspace port files', () => {
  const source = readFileSync(
    resolve(
      'scripts/windows/convert-pbix.ps1',
    ),
    'utf-8',
  );

  assert.match(
    source,
    /function Get-ProcessPorts/,
  );
  assert.match(
    source,
    /Get-Process -Name msmdsrv/,
  );
  assert.match(
    source,
    /netstat\.exe.*-ano.*-p tcp/s,
  );
  assert.match(
    source,
    /function Get-DesktopModelCandidates/,
  );
  assert.match(
    source,
    /process\+workspace/,
  );
  assert.match(
    source,
    /Discovery observed ports:/,
  );
});
