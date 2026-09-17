import assert from 'node:assert/strict';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { runCli } from '../src/cli.js';
import { writePbipFixture } from './fixtures/pbip.js';

test('CLI generates a standalone HTML runbook and structured JSON', async () => {
  const root = mkdtempSync(join(tmpdir(), 'pbi-profiling-cli-'));
  const project = join(root, 'project');
  const output = join(root, 'output');

  try {
    writePbipFixture(project);

    const exitCode = await runCli([
      'profile',
      project,
      '--output',
      output,
    ]);

    assert.equal(exitCode, 0);

    const htmlPath = join(output, 'profile.html');
    const jsonPath = join(output, 'profile.json');

    assert.equal(existsSync(htmlPath), true);
    assert.equal(existsSync(jsonPath), true);
    assert.ok(statSync(htmlPath).size > 10_000);

    const html = readFileSync(htmlPath, 'utf-8');
    const profile = JSON.parse(readFileSync(jsonPath, 'utf-8'));

    assert.match(html, /PBI Profiling/);
    assert.match(html, /id="lineage-payload"/);
    assert.match(html, /id="profile-payload"/);
    assert.equal(html.includes('<script src='), false);
    assert.equal(profile.overview.counts.tables, 2);
    assert.equal(profile.overview.counts.visuals, 1);
  } finally {
    rmSync(root, {
      recursive: true,
      force: true,
    });
  }
});
