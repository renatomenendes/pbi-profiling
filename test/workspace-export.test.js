import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  listWorkspaceFiles,
  removeWorkspace,
  resolveWorkspaceFile,
} from '../src/app/workspace-export.js';

test('converted workspace export lists files recursively and preserves relative paths', () => {
  const root = mkdtempSync(
    join(
      tmpdir(),
      'pbi-profiling-workspace-export-',
    ),
  );

  try {
    mkdirSync(
      join(
        root,
        'Sample.Report',
        'definition',
      ),
      {
        recursive: true,
      },
    );

    writeFileSync(
      join(
        root,
        'Sample.pbip',
      ),
      '{"version":"1.0"}',
      'utf-8',
    );

    writeFileSync(
      join(
        root,
        'Sample.Report',
        'definition',
        'report.json',
      ),
      '{"name":"Sample"}',
      'utf-8',
    );

    const files =
      listWorkspaceFiles(root);

    assert.deepEqual(
      files.map((item) => item.path),
      [
        'Sample.pbip',
        'Sample.Report/definition/report.json',
      ],
    );

    const resolved =
      resolveWorkspaceFile(
        root,
        'Sample.Report/definition/report.json',
      );

    assert.equal(
      readFileSync(
        resolved,
        'utf-8',
      ),
      '{"name":"Sample"}',
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

test('converted workspace export rejects path traversal', () => {
  const root = mkdtempSync(
    join(
      tmpdir(),
      'pbi-profiling-workspace-traversal-',
    ),
  );

  try {
    assert.throws(
      () =>
        resolveWorkspaceFile(
          root,
          '../escape.pbip',
        ),
      /unsafe segment|relative|escapes/i,
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

test('converted workspace cleanup removes the temporary folder idempotently', () => {
  const root = mkdtempSync(
    join(
      tmpdir(),
      'pbi-profiling-workspace-cleanup-',
    ),
  );

  writeFileSync(
    join(
      root,
      'Sample.pbip',
    ),
    '{}',
    'utf-8',
  );

  removeWorkspace(root);
  assert.equal(
    existsSync(root),
    false,
  );

  assert.doesNotThrow(
    () => removeWorkspace(root),
  );
});
