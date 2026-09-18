import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

test('native Windows picker supports PBIX, PBIP and project folders without installation', () => {
  const source = readFileSync(
    resolve(
      'scripts/windows/select-powerbi-target.ps1',
    ),
    'utf-8',
  );

  assert.match(
    source,
    /System\.Windows\.Forms/,
  );
  assert.match(
    source,
    /OpenFileDialog/,
  );
  assert.match(
    source,
    /FolderBrowserDialog/,
  );
  assert.match(
    source,
    /Power BI Desktop \(\*\.pbix\)\|\*\.pbix/,
  );
  assert.match(
    source,
    /Power BI Project \(\*\.pbip\)\|\*\.pbip/,
  );

  assert.equal(
    /npm\s+(?:install|ci)(?:\s|$)/i.test(source),
    false,
  );
  assert.equal(
    /pip\s+install/i.test(source),
    false,
  );
  assert.equal(
    /-ExecutionPolicy\s+(?:Bypass|Unrestricted)/i.test(source),
    false,
  );
});

test('Node picker launches Windows PowerShell in STA and never exposes arbitrary picker kinds', () => {
  const source = readFileSync(
    resolve(
      'src/app/picker.js',
    ),
    'utf-8',
  );

  assert.match(
    source,
    /'-STA'/,
  );
  assert.match(
    source,
    /process\.platform !== 'win32'/,
  );
  assert.match(
    source,
    /'pbix'/,
  );
  assert.match(
    source,
    /'pbip'/,
  );
  assert.match(
    source,
    /'folder'/,
  );
  assert.match(
    source,
    /SUPPORTED_KINDS/,
  );
});
