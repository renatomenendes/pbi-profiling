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
  exportWorkspaceToDirectory,
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


test('converted workspace export copies to a user path with collision-safe project folders', async () => {
  const root = mkdtempSync(
    join(
      tmpdir(),
      'pbi-profiling-workspace-source-',
    ),
  );
  const destination = mkdtempSync(
    join(
      tmpdir(),
      'pbi-profiling-workspace-destination-',
    ),
  );

  try {
    mkdirSync(
      join(
        root,
        'Sample.SemanticModel',
        'definition',
      ),
      {
        recursive: true,
      },
    );

    writeFileSync(
      join(root, 'Sample.pbip'),
      '{}',
      'utf-8',
    );
    writeFileSync(
      join(
        root,
        'Sample.SemanticModel',
        'definition',
        'model.tmdl',
      ),
      'model Model',
      'utf-8',
    );

    const first =
      await exportWorkspaceToDirectory(
        root,
        destination,
        'Sample',
      );

    assert.equal(
      first.path,
      join(
        destination,
        'Sample-PBIP',
      ),
    );
    assert.equal(
      existsSync(
        join(
          first.path,
          'Sample.SemanticModel',
          'definition',
          'model.tmdl',
        ),
      ),
      true,
    );

    const second =
      await exportWorkspaceToDirectory(
        root,
        destination,
        'Sample',
      );

    assert.equal(
      second.path,
      join(
        destination,
        'Sample-PBIP-2',
      ),
    );
  } finally {
    rmSync(
      root,
      {
        recursive: true,
        force: true,
      },
    );
    rmSync(
      destination,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test('converted workspace export requires an absolute destination', async () => {
  const root = mkdtempSync(
    join(
      tmpdir(),
      'pbi-profiling-workspace-absolute-',
    ),
  );

  try {
    writeFileSync(
      join(root, 'Sample.pbip'),
      '{}',
      'utf-8',
    );

    await assert.rejects(
      () =>
        exportWorkspaceToDirectory(
          root,
          'relative-output',
          'Sample',
        ),
      /absolute path/i,
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
