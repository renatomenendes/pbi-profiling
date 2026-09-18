import {
  createWriteStream,
  mkdirSync,
  rmSync,
} from 'node:fs';
import {
  dirname,
  resolve,
  sep,
} from 'node:path';
import { randomUUID } from 'node:crypto';

import { shouldRead } from '../../vendor/pbi-lineage-lenz/packages/core/src/index.js';
import { analyzeProject } from '../engine/analyze.js';
import {
  assertAnalyzedProjectIsProfileable,
} from '../application/validation.js';

export const MAX_PROJECT_FILE_BYTES =
  64 * 1024 * 1024;
export const MAX_PROJECT_TOTAL_BYTES =
  512 * 1024 * 1024;
export const MAX_PROJECT_FILES = 5_000;

export function createBrowserProjectUpload(
  appRoot,
  label = 'Power BI project',
) {
  const id = randomUUID();
  const root = resolve(
    appRoot,
    'projects',
    id,
    'project',
  );

  mkdirSync(
    root,
    {
      recursive: true,
    },
  );

  return {
    id,
    label:
      String(label ?? '').trim() ||
      'Power BI project',
    root,
    status: 'uploading',
    files: new Set(),
    fileCount: 0,
    totalBytes: 0,
    validation: null,
    createdAt: new Date().toISOString(),
  };
}

export async function receiveBrowserProjectFile(
  request,
  upload,
  rawRelativePath,
) {
  if (upload.status !== 'uploading') {
    throw new Error(
      'Project upload is not accepting files.',
    );
  }

  const relativePath =
    normalizeProjectRelativePath(
      rawRelativePath,
    );

  if (!shouldRead(relativePath)) {
    throw new Error(
      `Project file is not part of the profiling contract: ${relativePath}`,
    );
  }

  if (upload.files.has(relativePath)) {
    throw new Error(
      `Duplicate project file: ${relativePath}`,
    );
  }

  if (
    upload.fileCount + 1 >
    MAX_PROJECT_FILES
  ) {
    throw new Error(
      `Project exceeds the file-count limit of ${MAX_PROJECT_FILES} relevant files.`,
    );
  }

  const destination =
    resolveProjectDestination(
      upload.root,
      relativePath,
    );

  const bytes = await streamRequestToFile(
    request,
    destination,
    MAX_PROJECT_FILE_BYTES,
  );

  if (
    upload.totalBytes + bytes >
    MAX_PROJECT_TOTAL_BYTES
  ) {
    rmSync(
      destination,
      {
        force: true,
      },
    );
    throw new Error(
      'Project exceeds the local-app upload limit for relevant profiling files.',
    );
  }

  upload.files.add(relativePath);
  upload.fileCount += 1;
  upload.totalBytes += bytes;

  return {
    relativePath,
    bytes,
    fileCount: upload.fileCount,
    totalBytes: upload.totalBytes,
  };
}

export function validateBrowserProjectUpload(
  upload,
) {
  if (
    upload.status !== 'uploading' &&
    upload.status !== 'ready'
  ) {
    throw new Error(
      'Project upload cannot be validated in its current state.',
    );
  }

  if (upload.fileCount === 0) {
    throw new Error(
      'No relevant PBIP/TMDL/PBIR files were uploaded.',
    );
  }

  const analyzed =
    analyzeProject(upload.root);
  const structural =
    assertAnalyzedProjectIsProfileable(
      analyzed,
      {
        source:
          'Selected PBIP project',
      },
    );

  const validation = {
    ...structural,
    fileCount: upload.fileCount,
    totalBytes: upload.totalBytes,
    note:
      analyzed.note ?? null,
  };

  upload.status = 'ready';
  upload.validation = validation;

  return validation;
}

export function normalizeProjectRelativePath(
  value,
) {
  const normalized = String(value ?? '')
    .replaceAll('\\', '/')
    .replace(/^\/+/, '')
    .trim();

  if (!normalized) {
    throw new Error(
      'Project file path is required.',
    );
  }

  if (
    normalized.includes('\u0000') ||
    /^[A-Za-z]:/.test(normalized)
  ) {
    throw new Error(
      'Project file path must be relative.',
    );
  }

  const parts = normalized.split('/');

  if (
    parts.some(
      (part) =>
        !part ||
        part === '.' ||
        part === '..',
    )
  ) {
    throw new Error(
      'Project file path contains an unsafe segment.',
    );
  }

  return parts.join('/');
}

function resolveProjectDestination(
  root,
  relativePath,
) {
  const destination = resolve(
    root,
    ...relativePath.split('/'),
  );
  const prefix =
    root.endsWith(sep)
      ? root
      : `${root}${sep}`;

  if (!destination.startsWith(prefix)) {
    throw new Error(
      'Project file path escapes the staging directory.',
    );
  }

  return destination;
}

function streamRequestToFile(
  request,
  destination,
  maxBytes,
) {
  return new Promise(
    (resolvePromise, rejectPromise) => {
      mkdirSync(
        dirname(destination),
        {
          recursive: true,
        },
      );

      const declared = Number(
        request.headers['content-length'] ?? 0,
      );

      if (
        Number.isFinite(declared) &&
        declared > maxBytes
      ) {
        rejectPromise(
          new Error(
            'Project file exceeds the per-file upload limit.',
          ),
        );
        return;
      }

      const output = createWriteStream(
        destination,
        {
          flags: 'wx',
        },
      );

      let bytes = 0;
      let failed = false;

      const fail = (error) => {
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

          if (bytes > maxBytes) {
            request.destroy();
            fail(
              new Error(
                'Project file exceeds the per-file upload limit.',
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
            resolvePromise(bytes);
          }
        },
      );

      request.pipe(output);
    },
  );
}
