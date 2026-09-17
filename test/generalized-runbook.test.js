import assert from 'node:assert/strict';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { runCli } from '../src/cli.js';
import { writePbipFixture } from './fixtures/pbip.js';

test('zero-config sales PBIP produces a generalized runbook', async () => {
  const root = mkdtempSync(join(tmpdir(), 'pbi-profiling-generalized-'));
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

    const profile = JSON.parse(
      readFileSync(join(output, 'profile.json'), 'utf-8'),
    );
    const html = readFileSync(join(output, 'profile.html'), 'utf-8');
    const families = new Set(
      profile.analytical.opportunities.map((item) => item.family),
    );

    assert.equal(
      profile.analytical.methodology.semanticConfiguration.status,
      'not-provided',
    );
    assert.ok(families.has('descriptive'));
    assert.ok(families.has('diagnostic'));
    assert.ok(families.has('forecasting'));
    assert.ok(families.has('anomaly-detection'));
    assert.match(html, /Cobertura de origem externa/);
    assert.match(html, /Famílias analíticas observadas/);
    assert.match(html, /Descritiva/);
    assert.match(html, /Previsão/);
    assert.match(html, /Anomalias/);
    assert.match(html, /Semântica genérica/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
