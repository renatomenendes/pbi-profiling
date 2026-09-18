import assert from 'node:assert/strict';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { profileTarget } from '../src/application/profile.js';
import { writePbipFixture } from './fixtures/pbip.js';

test('shared application pipeline profiles PBIP and emits all durable artifacts', async () => {
  const root = mkdtempSync(
    join(tmpdir(), 'pbi-profiling-application-'),
  );
  const project = join(root, 'project');
  const output = join(root, 'output');
  const events = [];

  try {
    writePbipFixture(project);

    const result = await profileTarget(
      project,
      {
        outputDirectory: output,
        onProgress(event) {
          events.push(event.phase);
        },
      },
    );

    assert.equal(
      result.intake.kind,
      'pbip-folder',
    );
    assert.equal(
      result.intake.converted,
      false,
    );
    assert.equal(
      result.workspacePath,
      null,
    );

    assert.equal(
      existsSync(result.outputs.html),
      true,
    );
    assert.equal(
      existsSync(result.outputs.json),
      true,
    );
    assert.equal(
      existsSync(result.outputs.rag),
      true,
    );

    const profile = JSON.parse(
      readFileSync(
        result.outputs.json,
        'utf-8',
      ),
    );

    assert.equal(
      profile.overview.counts.tables,
      2,
    );
    assert.ok(
      events.includes('analyzing'),
    );
    assert.ok(
      events.includes('rendering'),
    );
    assert.ok(
      events.includes('completed'),
    );
  } finally {
    rmSync(
      root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});
