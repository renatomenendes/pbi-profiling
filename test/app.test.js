import assert from 'node:assert/strict';
import {
  mkdtempSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { startLocalApp } from '../src/app/server.js';
import { readProjectFolder } from '../src/io/project.js';
import { writePbipFixture } from './fixtures/pbip.js';

async function waitForJob(
  origin,
  token,
  jobId,
  timeoutMs = 10_000,
) {
  const deadline = Date.now() + timeoutMs;
  let job = null;

  while (Date.now() < deadline) {
    const response = await fetch(
      origin + '/api/jobs/' + jobId,
      {
        headers: {
          'x-pbi-profiling-token': token,
        },
      },
    );

    assert.equal(
      response.status,
      200,
    );

    job = await response.json();

    if (
      job.status === 'completed' ||
      job.status === 'failed'
    ) {
      return job;
    }

    await new Promise(
      (resolvePromise) => {
        setTimeout(resolvePromise, 50);
      },
    );
  }

  return job;
}

test('local app exposes browser-native intake and preserves manual-path profiling', async () => {
  const root = mkdtempSync(
    join(
      tmpdir(),
      'pbi-profiling-app-test-',
    ),
  );
  const project = join(
    root,
    'project',
  );
  writePbipFixture(project);

  const app = await startLocalApp({
    open: false,
  });

  try {
    const url = new URL(app.url);
    const origin = url.origin;

    const page = await fetch(app.url);
    assert.equal(page.status, 200);

    const html = await page.text();

    assert.match(
      html,
      /Universal Intake/,
    );
    assert.match(
      html,
      /Selecionar PBIX/,
    );
    assert.match(
      html,
      /Selecionar pasta do projeto/,
    );
    assert.match(
      html,
      /showDirectoryPicker/,
    );
    assert.match(
      html,
      /webkitdirectory/,
    );
    assert.match(
      html,
      /\/api\/jobs\/pbix/,
    );
    assert.doesNotMatch(
      html,
      /\/api\/picker/,
    );
    assert.doesNotMatch(
      html,
      /WinForms|Windows Forms/i,
    );

    const unauthorized = await fetch(
      origin + '/api/jobs/path',
      {
        method: 'POST',
        headers: {
          'content-type':
            'application/json',
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
      origin + '/api/jobs/path',
      {
        method: 'POST',
        headers: {
          'content-type':
            'application/json',
          'x-pbi-profiling-token':
            app.token,
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

    const created =
      await create.json();

    const job = await waitForJob(
      origin,
      app.token,
      created.jobId,
    );

    assert.equal(
      job?.status,
      'completed',
      job?.message,
    );

    const profile = await fetch(
      origin +
        '/api/jobs/' +
        created.jobId +
        '/profile?token=' +
        app.token,
    );

    assert.equal(
      profile.status,
      200,
    );

    const profileJson =
      await profile.json();

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

test('browser PBIP staging validates and profiles the same relevant-file contract as local folders', async () => {
  const root = mkdtempSync(
    join(
      tmpdir(),
      'pbi-profiling-browser-project-',
    ),
  );
  const sourceProject = join(
    root,
    'source-project',
  );
  writePbipFixture(sourceProject);

  const relevantFiles =
    readProjectFolder(sourceProject);

  const app = await startLocalApp({
    open: false,
  });

  try {
    const url = new URL(app.url);
    const origin = url.origin;

    const create = await fetch(
      origin + '/api/projects',
      {
        method: 'POST',
        headers: {
          'content-type':
            'application/json',
          'x-pbi-profiling-token':
            app.token,
        },
        body: JSON.stringify({
          name: 'Browser selected project',
        }),
      },
    );

    assert.equal(
      create.status,
      201,
    );

    const created =
      await create.json();

    for (const [path, content] of relevantFiles) {
      const upload = await fetch(
        origin +
          '/api/projects/' +
          created.projectId +
          '/files?path=' +
          encodeURIComponent(path),
        {
          method: 'PUT',
          headers: {
            'content-type':
              'application/octet-stream',
            'x-pbi-profiling-token':
              app.token,
          },
          body: Buffer.from(
            content,
            'utf-8',
          ),
        },
      );

      assert.equal(
        upload.status,
        201,
        await upload.text(),
      );
    }

    const validate = await fetch(
      origin +
        '/api/projects/' +
        created.projectId +
        '/validate',
      {
        method: 'POST',
        headers: {
          'x-pbi-profiling-token':
            app.token,
        },
      },
    );

    assert.equal(
      validate.status,
      200,
      await validate.text(),
    );

    const validation =
      await validate.json();

    assert.equal(
      validation.ready,
      true,
    );
    assert.equal(
      validation.fileCount,
      relevantFiles.size,
    );

    const run = await fetch(
      origin +
        '/api/projects/' +
        created.projectId +
        '/profile',
      {
        method: 'POST',
        headers: {
          'x-pbi-profiling-token':
            app.token,
        },
      },
    );

    assert.equal(
      run.status,
      202,
    );

    const started =
      await run.json();

    const job = await waitForJob(
      origin,
      app.token,
      started.jobId,
    );

    assert.equal(
      job?.status,
      'completed',
      job?.message,
    );

    const profile = await fetch(
      origin +
        '/api/jobs/' +
        started.jobId +
        '/profile?token=' +
        app.token,
    );

    const profileJson =
      await profile.json();

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

test('browser PBIP staging rejects unsafe relative paths', async () => {
  const app = await startLocalApp({
    open: false,
  });

  try {
    const url = new URL(app.url);
    const origin = url.origin;

    const create = await fetch(
      origin + '/api/projects',
      {
        method: 'POST',
        headers: {
          'content-type':
            'application/json',
          'x-pbi-profiling-token':
            app.token,
        },
        body: JSON.stringify({
          name: 'Traversal test',
        }),
      },
    );

    const created =
      await create.json();

    const upload = await fetch(
      origin +
        '/api/projects/' +
        created.projectId +
        '/files?path=' +
        encodeURIComponent(
          '../../escape.tmdl',
        ),
      {
        method: 'PUT',
        headers: {
          'content-type':
            'application/octet-stream',
          'x-pbi-profiling-token':
            app.token,
        },
        body: Buffer.from(
          'table Test',
          'utf-8',
        ),
      },
    );

    assert.equal(
      upload.status,
      400,
    );

    const payload =
      await upload.json();

    assert.match(
      payload.error,
      /unsafe segment|relative/i,
    );
  } finally {
    await app.close();
  }
});

test('PBIX upload contract remains streaming and accepts realistic corporate filenames', async () => {
  const app = await startLocalApp({
    open: false,
  });

  try {
    const url = new URL(app.url);
    const origin = url.origin;

    const response = await fetch(
      origin +
        '/api/jobs/pbix?keepWorkspace=1&timeout=30',
      {
        method: 'POST',
        headers: {
          'content-type':
            'application/octet-stream',
          'x-file-name':
            encodeURIComponent(
              '[PRD]SLA_POP_Novo_Analitico.pbix',
            ),
          'x-pbi-profiling-token':
            app.token,
        },
        body: Buffer.from(
          'synthetic-pbix-body',
        ),
      },
    );

    const responseText =
      await response.text();

    assert.equal(
      response.status,
      202,
      responseText,
    );

    const payload =
      JSON.parse(responseText);

    const job = await waitForJob(
      origin,
      app.token,
      payload.jobId,
    );

    assert.equal(
      job?.status,
      'failed',
    );
    assert.doesNotMatch(
      job.message,
      /ENOENT|no such file or directory/i,
    );

    if (process.platform !== 'win32') {
      assert.match(
        job.message,
        /PBIX intake requires Windows/i,
      );
    }
  } finally {
    await app.close();
  }
});
