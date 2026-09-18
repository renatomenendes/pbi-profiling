import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import {
  basename,
  dirname,
  join,
  resolve,
} from 'node:path';
import {
  randomBytes,
  randomUUID,
} from 'node:crypto';

import { profileTarget } from '../application/profile.js';
import { openPbixInDesktop } from '../intake/open-pbix.js';
import { renderAppPage } from './page.js';
import { openBrowser } from './open.js';
import {
  createBrowserProjectUpload,
  receiveBrowserProjectFile,
  validateBrowserProjectUpload,
} from './project-upload.js';

const MAX_UPLOAD_BYTES =
  8 * 1024 * 1024 * 1024;

export async function startLocalApp(
  {
    host = '127.0.0.1',
    port = 0,
    open = true,
  } = {},
) {
  if (
    host !== '127.0.0.1' &&
    host !== 'localhost'
  ) {
    throw new Error(
      'The local app may listen only on loopback.',
    );
  }

  const token =
    randomBytes(24).toString('hex');
  const appRoot = mkdtempSync(
    join(
      tmpdir(),
      'pbi-profiling-app-',
    ),
  );
  const jobs = new Map();
  const projectUploads = new Map();
  let queue = Promise.resolve();

  const server = createServer(
    (request, response) => {
      handleRequest(
        request,
        response,
        {
          token,
          appRoot,
          jobs,
          projectUploads,
          enqueue(task) {
            queue = queue
              .then(task)
              .catch(() => {});
          },
        },
      ).catch((error) => {
        sendJson(
          response,
          500,
          {
            error:
              error instanceof Error
                ? error.message
                : String(error),
          },
        );
      });
    },
  );

  await new Promise(
    (resolvePromise, rejectPromise) => {
      server.once(
        'error',
        rejectPromise,
      );
      server.listen(
        port,
        host,
        () => {
          server.off(
            'error',
            rejectPromise,
          );
          resolvePromise();
        },
      );
    },
  );

  const address = server.address();
  const actualPort =
    typeof address === 'object' &&
    address
      ? address.port
      : port;

  const url =
    'http://127.0.0.1:' +
    actualPort +
    '/?token=' +
    encodeURIComponent(token);

  if (open) {
    openBrowser(url);
  }

  let closed = false;

  return {
    server,
    token,
    url,
    async close() {
      if (closed) {
        return;
      }

      closed = true;

      await new Promise(
        (resolvePromise) => {
          server.close(
            () => resolvePromise(),
          );
        },
      );

      rmSync(
        appRoot,
        {
          recursive: true,
          force: true,
        },
      );
    },
  };
}

async function handleRequest(
  request,
  response,
  {
    token,
    appRoot,
    jobs,
    projectUploads,
    enqueue,
  },
) {
  const url = new URL(
    request.url ?? '/',
    'http://127.0.0.1',
  );

  if (
    request.method === 'GET' &&
    url.pathname === '/'
  ) {
    sendHtml(
      response,
      200,
      renderAppPage(),
    );
    return;
  }

  if (
    !authorized(
      request,
      url,
      token,
    )
  ) {
    sendJson(
      response,
      403,
      {
        error:
          'Invalid local-app session token.',
      },
    );
    return;
  }

  if (
    request.method === 'POST' &&
    url.pathname === '/api/pbix/open'
  ) {
    await handlePbixOpen(
      request,
      response,
      appRoot,
    );
    return;
  }

  if (
    request.method === 'POST' &&
    url.pathname === '/api/projects'
  ) {
    const payload =
      await readJsonBody(request);

    const upload =
      createBrowserProjectUpload(
        appRoot,
        payload.name,
      );

    projectUploads.set(
      upload.id,
      upload,
    );

    sendJson(
      response,
      201,
      {
        projectId: upload.id,
      },
    );
    return;
  }

  const projectRoute =
    matchProjectRoute(url.pathname);

  if (projectRoute) {
    const upload =
      projectUploads.get(
        projectRoute.id,
      );

    if (!upload) {
      sendJson(
        response,
        404,
        {
          error:
            'Staged project not found.',
        },
      );
      return;
    }

    if (
      request.method === 'PUT' &&
      projectRoute.action === 'files'
    ) {
      try {
        const result =
          await receiveBrowserProjectFile(
            request,
            upload,
            url.searchParams.get(
              'path',
            ),
          );

        sendJson(
          response,
          201,
          result,
        );
      } catch (error) {
        sendJson(
          response,
          400,
          {
            error:
              error instanceof Error
                ? error.message
                : String(error),
          },
        );
      }
      return;
    }

    if (
      request.method === 'POST' &&
      projectRoute.action ===
        'validate'
    ) {
      try {
        const validation =
          validateBrowserProjectUpload(
            upload,
          );

        sendJson(
          response,
          200,
          validation,
        );
      } catch (error) {
        sendJson(
          response,
          400,
          {
            error:
              error instanceof Error
                ? error.message
                : String(error),
          },
        );
      }
      return;
    }

    if (
      request.method === 'POST' &&
      projectRoute.action ===
        'profile'
    ) {
      if (
        upload.status !== 'ready' ||
        !upload.validation?.ready
      ) {
        sendJson(
          response,
          409,
          {
            error:
              'Project must be validated before profiling.',
          },
        );
        return;
      }

      const job = createJob(
        jobs,
        appRoot,
        upload.label,
      );

      scheduleProfileJob(
        job,
        upload.root,
        {
          projectNameOverride:
            upload.label,
        },
        enqueue,
      );

      sendJson(
        response,
        202,
        {
          jobId: job.id,
        },
      );
      return;
    }
  }

  const jobRoute =
    matchJobRoute(url.pathname);

  if (jobRoute) {
    const job =
      jobs.get(jobRoute.id);

    if (!job) {
      sendJson(
        response,
        404,
        {
          error: 'Job not found.',
        },
      );
      return;
    }

    if (
      request.method === 'GET' &&
      jobRoute.resource === 'status'
    ) {
      sendJson(
        response,
        200,
        publicJob(job),
      );
      return;
    }

    if (
      request.method === 'GET'
    ) {
      if (
        job.status !== 'completed'
      ) {
        sendJson(
          response,
          409,
          {
            error:
              'Job is not completed.',
          },
        );
        return;
      }

      const resource = {
        runbook: {
          path: job.outputs?.html,
          contentType:
            'text/html; charset=utf-8',
          disposition: 'inline',
        },
        profile: {
          path: job.outputs?.json,
          contentType:
            'application/json; charset=utf-8',
          disposition:
            'attachment; filename="profile.json"',
        },
        rag: {
          path: job.outputs?.rag,
          contentType:
            'application/x-ndjson; charset=utf-8',
          disposition:
            'attachment; filename="profile.rag.jsonl"',
        },
      }[jobRoute.resource];

      if (
        !resource?.path ||
        !existsSync(resource.path)
      ) {
        sendJson(
          response,
          404,
          {
            error:
              'Generated artifact not found.',
          },
        );
        return;
      }

      response.writeHead(
        200,
        securityHeaders({
          'content-type':
            resource.contentType,
          'content-disposition':
            resource.disposition,
        }),
      );

      createReadStream(
        resource.path,
      ).pipe(response);
      return;
    }
  }

  sendJson(
    response,
    404,
    {
      error: 'Not found.',
    },
  );
}

async function handlePbixOpen(
  request,
  response,
  appRoot,
) {
  const originalName =
    decodeSafe(
      request.headers[
        'x-file-name'
      ],
    );
  const safeName =
    sanitizePbixName(
      originalName,
    );

  if (!safeName) {
    sendJson(
      response,
      400,
      {
        error:
          'A valid .pbix file name is required.',
      },
    );
    return;
  }

  const stagingRoot = resolve(
    appRoot,
    'pbix',
    randomUUID(),
  );
  const inputFile = join(
    stagingRoot,
    safeName,
  );

  try {
    await streamRequestToFile(
      request,
      inputFile,
      MAX_UPLOAD_BYTES,
    );

    const opened =
      await openPbixInDesktop(
        inputFile,
      );

    sendJson(
      response,
      200,
      {
        opened: true,
        fileName: safeName,
        processId:
          opened.processId,
        message:
          'PBIX opened in Power BI Desktop. Use File > Save As and choose Power BI Project (.pbip).',
      },
    );
  } catch (error) {
    rmSync(
      stagingRoot,
      {
        recursive: true,
        force: true,
      },
    );

    sendJson(
      response,
      400,
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
    );
  }
}

function createJob(
  jobs,
  appRoot,
  label,
) {
  const id = randomUUID();
  const root = resolve(
    appRoot,
    'jobs',
    id,
  );

  mkdirSync(
    root,
    {
      recursive: true,
    },
  );

  const job = {
    id,
    label,
    root,
    status: 'queued',
    message:
      'Queued for local processing.',
    events: [],
    outputs: null,
    startedAt: null,
    completedAt: null,
  };

  jobs.set(
    id,
    job,
  );

  return job;
}

function scheduleProfileJob(
  job,
  targetPath,
  options,
  enqueue,
) {
  enqueue(async () => {
    job.status = 'running';
    job.startedAt =
      new Date().toISOString();

    try {
      const result =
        await profileTarget(
          targetPath,
          {
            outputDirectory:
              join(
                job.root,
                'output',
              ),
            projectNameOverride:
              options.projectNameOverride ??
              null,
            onProgress(event) {
              job.message =
                event.message;
              job.events.push({
                phase: event.phase,
                message:
                  event.message,
                at:
                  new Date().toISOString(),
              });

              if (
                job.events.length >
                100
              ) {
                job.events.shift();
              }
            },
          },
        );

      job.outputs =
        result.outputs;
      job.status = 'completed';
      job.message =
        'Runbook generated successfully.';
      job.completedAt =
        new Date().toISOString();
    } catch (error) {
      job.status = 'failed';
      job.message =
        error instanceof Error
          ? error.message
          : String(error);
      job.completedAt =
        new Date().toISOString();
    }
  });
}

function publicJob(job) {
  return {
    id: job.id,
    label: job.label,
    status: job.status,
    message: job.message,
    events: job.events,
    startedAt: job.startedAt,
    completedAt:
      job.completedAt,
  };
}

function matchProjectRoute(
  pathname,
) {
  const match =
    /^\/api\/projects\/([^/]+)\/(files|validate|profile)$/.exec(
      pathname,
    );

  if (!match) {
    return null;
  }

  return {
    id:
      decodeURIComponent(
        match[1],
      ),
    action: match[2],
  };
}

function matchJobRoute(
  pathname,
) {
  const match =
    /^\/api\/jobs\/([^/]+)(?:\/(runbook|profile|rag))?$/.exec(
      pathname,
    );

  if (!match) {
    return null;
  }

  return {
    id:
      decodeURIComponent(
        match[1],
      ),
    resource:
      match[2] ?? 'status',
  };
}

function authorized(
  request,
  url,
  token,
) {
  const header =
    request.headers[
      'x-pbi-profiling-token'
    ];
  const query =
    url.searchParams.get(
      'token',
    );

  return (
    header === token ||
    query === token
  );
}

function securityHeaders(
  extra = {},
) {
  return {
    'cache-control': 'no-store',
    'content-security-policy':
      "default-src 'self'; img-src 'self' data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'",
    'cross-origin-resource-policy':
      'same-origin',
    'referrer-policy':
      'no-referrer',
    'x-content-type-options':
      'nosniff',
    'x-frame-options':
      'DENY',
    ...extra,
  };
}

function sendHtml(
  response,
  status,
  html,
) {
  response.writeHead(
    status,
    securityHeaders({
      'content-type':
        'text/html; charset=utf-8',
    }),
  );
  response.end(html);
}

function sendJson(
  response,
  status,
  value,
) {
  if (response.headersSent) {
    response.end();
    return;
  }

  response.writeHead(
    status,
    securityHeaders({
      'content-type':
        'application/json; charset=utf-8',
    }),
  );

  response.end(
    JSON.stringify(value),
  );
}

async function readJsonBody(
  request,
) {
  const chunks = [];
  let bytes = 0;
  const limit = 64 * 1024;

  for await (
    const chunk of request
  ) {
    bytes += chunk.length;

    if (bytes > limit) {
      throw new Error(
        'JSON request body is too large.',
      );
    }

    chunks.push(chunk);
  }

  const text =
    Buffer.concat(
      chunks,
    ).toString('utf-8');

  try {
    return JSON.parse(
      text || '{}',
    );
  } catch (error) {
    throw new Error(
      'Invalid JSON request: ' +
      error.message,
    );
  }
}

function streamRequestToFile(
  request,
  destination,
  maxBytes,
) {
  return new Promise(
    (
      resolvePromise,
      rejectPromise,
    ) => {
      mkdirSync(
        dirname(destination),
        {
          recursive: true,
        },
      );

      const declared = Number(
        request.headers[
          'content-length'
        ] ?? 0,
      );

      if (
        Number.isFinite(
          declared,
        ) &&
        declared > maxBytes
      ) {
        rejectPromise(
          new Error(
            'PBIX exceeds the local-app upload limit.',
          ),
        );
        return;
      }

      const output =
        createWriteStream(
          destination,
          {
            flags: 'wx',
          },
        );

      let bytes = 0;
      let failed = false;

      const fail = (
        error,
      ) => {
        if (failed) {
          return;
        }

        failed = true;
        output.destroy();
        rmSync(
          destination,
          {
            force: true,
          },
        );
        rejectPromise(error);
      };

      request.on(
        'data',
        (chunk) => {
          bytes += chunk.length;

          if (
            bytes > maxBytes
          ) {
            request.destroy();
            fail(
              new Error(
                'PBIX exceeds the local-app upload limit.',
              ),
            );
          }
        },
      );

      request.on(
        'error',
        fail,
      );
      output.on(
        'error',
        fail,
      );

      output.on(
        'finish',
        () => {
          if (!failed) {
            resolvePromise();
          }
        },
      );

      request.pipe(output);
    },
  );
}

function sanitizePbixName(
  value,
) {
  const decoded =
    String(
      value ?? '',
    ).trim();

  if (!decoded) {
    return null;
  }

  const name =
    basename(decoded)
      .replace(
        /[<>:"/\\|?*\u0000-\u001F]/g,
        '_',
      )
      .trim();

  if (
    !name ||
    !name
      .toLowerCase()
      .endsWith('.pbix')
  ) {
    return null;
  }

  return name;
}

function decodeSafe(
  value,
) {
  if (
    typeof value !== 'string'
  ) {
    return '';
  }

  try {
    return decodeURIComponent(
      value,
    );
  } catch {
    return value;
  }
}
