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
  terminalStatuses = [
    'completed',
    'failed',
  ],
  timeoutMs = 10_000,
) {
  const deadline = Date.now() + timeoutMs;
  let job = null;

  while (Date.now() < deadline) {
    const response = await fetch(
      origin + '/api/jobs/' + jobId,
      {
        headers: {
          'x-pbi-profiling-token':
            token,
        },
      },
    );

    assert.equal(
      response.status,
      200,
    );

    job = await response.json();

    if (
      terminalStatuses.includes(
        job.status,
      )
    ) {
      return job;
    }

    await new Promise(
      (resolvePromise) => {
        setTimeout(
          resolvePromise,
          50,
        );
      },
    );
  }

  return job;
}

async function createBrowserProject(
  origin,
  token,
  name,
  files,
) {
  const create = await fetch(
    origin + '/api/projects',
    {
      method: 'POST',
      headers: {
        'content-type':
          'application/json',
        'x-pbi-profiling-token':
          token,
      },
      body: JSON.stringify({
        name,
      }),
    },
  );

  assert.equal(create.status, 201);
  const created = await create.json();

  for (const [path, content] of files) {
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
            token,
        },
        body: Buffer.from(
          content,
          'utf-8',
        ),
      },
    );

    const uploadText =
      await upload.text();

    assert.equal(
      upload.status,
      201,
      uploadText,
    );
  }

  return created.projectId;
}

test('local UI exposes one logical runbook action after project preparation', async () => {
  const app = await startLocalApp({
    open: false,
  });

  try {
    const page = await fetch(app.url);
    assert.equal(page.status, 200);

    const html = await page.text();

    assert.match(
      html,
      /Converter para PBIP/,
    );
    assert.match(
      html,
      /Selecionar pasta PBIP/,
    );
    assert.match(
      html,
      /Projeto preparado/,
    );
    assert.match(
      html,
      /Execução e resultado/,
    );

    assert.equal(
      (
        html.match(
          />\s*Gerar runbook\s*</g,
        ) ?? []
      ).length,
      1,
    );

    assert.match(
      html,
      /id="generate-runbook"/,
    );
    assert.doesNotMatch(
      html,
      /id="project-run"/,
    );
    assert.doesNotMatch(
      html,
      /id="pbix-run"/,
    );

    const inlineScript =
      html.match(
        /<script>([\s\S]*?)<\/script>/,
      )?.[1];

    assert.ok(inlineScript);
    assert.doesNotThrow(
      () => new Function(inlineScript),
    );
  } finally {
    await app.close();
  }
});

test('browser PBIP staging validates real TMDL before profiling', async () => {
  const root = mkdtempSync(
    join(
      tmpdir(),
      'pbi-profiling-browser-valid-',
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

    const projectId =
      await createBrowserProject(
        origin,
        app.token,
        'Browser selected project',
        relevantFiles,
      );

    const validate = await fetch(
      origin +
        '/api/projects/' +
        projectId +
        '/validate',
      {
        method: 'POST',
        headers: {
          'x-pbi-profiling-token':
            app.token,
        },
      },
    );

    const validationText =
      await validate.text();

    assert.equal(
      validate.status,
      200,
      validationText,
    );

    const validation =
      JSON.parse(validationText);

    assert.equal(
      validation.ready,
      true,
    );
    assert.ok(
      validation.tmdlFiles > 0,
    );
    assert.equal(
      validation.tables,
      2,
    );

    const run = await fetch(
      origin +
        '/api/projects/' +
        projectId +
        '/profile',
      {
        method: 'POST',
        headers: {
          'x-pbi-profiling-token':
            app.token,
        },
      },
    );

    assert.equal(run.status, 202);
    const started = await run.json();

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

test('PBIP with report metadata but no TMDL is rejected instead of producing an empty runbook', async () => {
  const app = await startLocalApp({
    open: false,
  });

  try {
    const url = new URL(app.url);
    const origin = url.origin;

    const files = new Map([
      [
        'Broken.SemanticModel/.platform',
        '{}',
      ],
      [
        'Broken.Report/.platform',
        '{}',
      ],
      [
        'Broken.Report/definition.pbir',
        JSON.stringify({
          version: '4.0',
          datasetReference: {
            byPath: {
              path:
                '../Broken.SemanticModel',
            },
          },
        }),
      ],
    ]);

    const projectId =
      await createBrowserProject(
        origin,
        app.token,
        'Broken PBIP',
        files,
      );

    const validate = await fetch(
      origin +
        '/api/projects/' +
        projectId +
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
      400,
    );

    const payload =
      await validate.json();

    assert.match(
      payload.error,
      /no TMDL files|not profileable/i,
    );

    const run = await fetch(
      origin +
        '/api/projects/' +
        projectId +
        '/profile',
      {
        method: 'POST',
        headers: {
          'x-pbi-profiling-token':
            app.token,
        },
      },
    );

    assert.equal(run.status, 409);
  } finally {
    await app.close();
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

    const created = await create.json();

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

    assert.equal(upload.status, 400);

    const payload = await upload.json();

    assert.match(
      payload.error,
      /unsafe segment|relative/i,
    );
  } finally {
    await app.close();
  }
});

test('PBIX upload remains streaming and enters conversion rather than profiling', async () => {
  const app = await startLocalApp({
    open: false,
  });

  try {
    const url = new URL(app.url);
    const origin = url.origin;

    const response = await fetch(
      origin +
        '/api/jobs/pbix?timeout=30',
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
      [
        'converted',
        'failed',
      ],
    );

    assert.equal(
      job?.kind,
      'conversion',
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
