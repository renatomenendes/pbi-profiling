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
  const deadline =
    Date.now() + timeoutMs;
  let job = null;

  while (Date.now() < deadline) {
    const response = await fetch(
      origin +
        '/api/jobs/' +
        jobId,
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
      job.status === 'completed' ||
      job.status === 'failed'
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

  assert.equal(
    create.status,
    201,
  );

  const created =
    await create.json();

  for (
    const [path, content]
    of files
  ) {
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

test('local UI enforces PBIX open, Desktop save-as-PBIP, then one runbook action', async () => {
  const app =
    await startLocalApp({
      open: false,
    });

  try {
    const page =
      await fetch(app.url);

    assert.equal(
      page.status,
      200,
    );

    const html =
      await page.text();

    assert.match(
      html,
      /Abrir no Power BI Desktop/,
    );
    assert.match(
      html,
      /Power BI Project \(\.pbip\)/,
    );
    assert.match(
      html,
      /Selecionar pasta PBIP/,
    );
    assert.match(
      html,
      /PBIT não é a entrada do profiler/,
    );

    assert.equal(
      (
        html.match(
          />\s*Gerar runbook\s*</g,
        ) ?? []
      ).length,
      1,
    );

    assert.doesNotMatch(
      html,
      /Converter para PBIP/,
    );
    assert.doesNotMatch(
      html,
      /Salvar PBIP convertido/,
    );
    assert.doesNotMatch(
      html,
      /TmdlSerializer/,
    );

    const inlineScript =
      html.match(
        /<script>([\s\S]*?)<\/script>/,
      )?.[1];

    assert.ok(inlineScript);
    assert.doesNotThrow(
      () =>
        new Function(
          inlineScript,
        ),
    );
  } finally {
    await app.close();
  }
});

test('browser-selected PBIP validates real TMDL before profiling', async () => {
  const root = mkdtempSync(
    join(
      tmpdir(),
      'pbi-profiling-browser-valid-',
    ),
  );
  const sourceProject =
    join(
      root,
      'source-project',
    );

  writePbipFixture(
    sourceProject,
  );

  const relevantFiles =
    readProjectFolder(
      sourceProject,
    );

  const app =
    await startLocalApp({
      open: false,
    });

  try {
    const url =
      new URL(app.url);
    const origin =
      url.origin;

    const projectId =
      await createBrowserProject(
        origin,
        app.token,
        'Browser selected project',
        relevantFiles,
      );

    const validate =
      await fetch(
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
      JSON.parse(
        validationText,
      );

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

    const run =
      await fetch(
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

    assert.equal(
      run.status,
      202,
    );

    const started =
      await run.json();

    const job =
      await waitForJob(
        origin,
        app.token,
        started.jobId,
      );

    assert.equal(
      job?.status,
      'completed',
      job?.message,
    );

    const profile =
      await fetch(
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
      profileJson
        .overview
        .counts
        .tables,
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

test('PBIP without TMDL is rejected before runbook generation', async () => {
  const app =
    await startLocalApp({
      open: false,
    });

  try {
    const url =
      new URL(app.url);
    const origin =
      url.origin;

    const files =
      new Map([
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

    const validate =
      await fetch(
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

    const run =
      await fetch(
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

    assert.equal(
      run.status,
      409,
    );
  } finally {
    await app.close();
  }
});

test('PBIX endpoint is an open-only Desktop workflow, not a converter', async () => {
  const app =
    await startLocalApp({
      open: false,
    });

  try {
    const url =
      new URL(app.url);
    const origin =
      url.origin;

    const response =
      await fetch(
        origin +
          '/api/pbix/open',
        {
          method: 'POST',
          headers: {
            'content-type':
              'application/octet-stream',
            'x-file-name':
              encodeURIComponent(
                'Sample.pbix',
              ),
            'x-pbi-profiling-token':
              app.token,
          },
          body: Buffer.from(
            'synthetic-pbix-body',
          ),
        },
      );

    const payload =
      await response.json();

    if (
      process.platform !== 'win32'
    ) {
      assert.equal(
        response.status,
        400,
      );
      assert.match(
        payload.error,
        /Windows and Power BI Desktop/i,
      );
    }
  } finally {
    await app.close();
  }
});
