import assert from 'node:assert/strict';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { runCli } from '../src/cli.js';
import { writePbipFixture } from './fixtures/pbip.js';

test('CLI auto-loads profiling config without persisting its absolute path', async () => {
  const root = mkdtempSync(join(tmpdir(), 'pbi-profiling-semantic-config-'));
  const project = join(root, 'project');
  const output = join(root, 'output');

  try {
    writePbipFixture(project);
    writeFileSync(
      join(project, 'pbi-profiling.config.json'),
      JSON.stringify({
        schemaVersion: 1,
        analysis: {
          semanticHints: {
            mode: 'extend',
            terms: {
              state: ['mode'],
            },
          },
        },
      }),
      'utf-8',
    );

    const exitCode = await runCli([
      'profile',
      project,
      '--output',
      output,
    ]);

    assert.equal(exitCode, 0);

    const profileText = readFileSync(join(output, 'profile.json'), 'utf-8');
    const profile = JSON.parse(profileText);
    const semantics = profile.analytical.methodology.semanticConfiguration;

    assert.equal(semantics.status, 'provided');
    assert.equal(semantics.source, 'pbi-profiling.config.json');
    assert.equal(semantics.mode, 'extend');
    assert.equal(semantics.customTermCount, 1);
    assert.equal(profileText.includes(root), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
