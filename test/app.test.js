import assert from 'node:assert/strict';
import {
  mkdtempSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { startLocalApp } from '../src/app/server.js';
import { writePbipFixture } from './fixtures/pbip.js';

test('local app is loopback-only, token-protected and profiles a PBIP path end-to-end', async () => {
  const root = mkdtempSync(
    join(tmpdir(), 'pbi-profiling-app-test-'),
  );
  const project = join(root, 'project');
  writePbipFixture(project);

  const app = await startLocalApp({
    open: false,
  });

  try {
    const url = new URL(app.url);
    const origin = url.origin;

    const page = await fetch(
      app.url,
    );
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(
      html,
      /Universal Intake/,
    );
    assert.match(
      html,
      /Gerar runbook/,
    );

    const unauthorized = await fetch(
      `${origin}/api/jobs/path`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          path: project,
        }),
      },
    );
    assert.equal(
      unauthorized.status,
      403,
    );

    const create = await fetch(
      `${origin}/api/jobs/path`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-pbi-profiling-token': app.token,
        },
        body: JSON.stringify({
          path: project,
        }),
      },
    );

    assert.equal(
      create.status,
      202,
    );
    const created = await create.json();
    assert.ok(created.jobId);

    let job;
    const deadline = Date.now() + 10_000;

    while (Date.now() < deadline) {
      const status = await fetch(
        `${origin}/api/jobs/${created.jobId}`,
        {
          headers: {
            'x-pbi-profiling-token': app.token,
          },
        },
      );
      assert.equal(status.status, 200);
      job = await status.json();

      if (
        job.status === 'completed' ||
        job.status === 'failed'
      ) {
        break;
      }

      await new Promise((resolvePromise) => {
        setTimeout(resolvePromise, 50);
      });
    }

    assert.equal(
      job?.status,
      'completed',
      job?.message,
    );

    const runbook = await fetch(
      `${origin}/api/jobs/${created.jobId}/runbook?token=${app.token}`,
    );
    assert.equal(
      runbook.status,
      200,
    );
    assert.match(
      await runbook.text(),
      /PBI Profiling/,
    );

    const profile = await fetch(
      `${origin}/api/jobs/${created.jobId}/profile?token=${app.token}`,
    );
    assert.equal(
      profile.status,
      200,
    );
    const profileJson = await profile.json();
    assert.equal(
      profileJson.overview.counts.tables,
      2,
    );
  } finally {
    await app.close();
    rmSync(
      root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});
