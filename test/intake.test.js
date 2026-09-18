import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { classifyTarget } from '../src/intake/prepare.js';
import { writePbipFixture } from './fixtures/pbip.js';

test('intake classifies PBIP folders, PBIP files and artifact folders deterministically', () => {
  const root = mkdtempSync(
    join(
      tmpdir(),
      'pbi-profiling-intake-',
    ),
  );
  const project =
    join(root, 'Project');

  try {
    writePbipFixture(project);

    const pbipFile =
      join(
        project,
        'Project.pbip',
      );

    writeFileSync(
      pbipFile,
      JSON.stringify({
        version: '1.0',
        artifacts: [
          {
            report: {
              path:
                'Sample.Report',
            },
          },
        ],
      }),
      'utf-8',
    );

    assert.equal(
      classifyTarget(
        project,
      ).kind,
      'pbip-folder',
    );

    const fileTarget =
      classifyTarget(pbipFile);

    assert.equal(
      fileTarget.kind,
      'pbip-file',
    );
    assert.equal(
      fileTarget.projectRoot,
      project,
    );
    assert.equal(
      fileTarget.projectName,
      'Project',
    );

    const semantic =
      classifyTarget(
        join(
          project,
          'Sample.SemanticModel',
        ),
      );

    assert.equal(
      semantic.kind,
      'semantic-model-folder',
    );
    assert.equal(
      semantic.projectRoot,
      project,
    );

    const report =
      classifyTarget(
        join(
          project,
          'Sample.Report',
        ),
      );

    assert.equal(
      report.kind,
      'report-folder',
    );
    assert.equal(
      report.projectRoot,
      project,
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

test('intake rejects PBIX and PBIT with explicit Save As PBIP guidance', () => {
  const root = mkdtempSync(
    join(
      tmpdir(),
      'pbi-profiling-non-pbip-',
    ),
  );

  try {
    for (
      const name of [
        'Sample.pbix',
        'Sample.pbit',
      ]
    ) {
      const file =
        join(root, name);

      writeFileSync(
        file,
        'synthetic',
        'utf-8',
      );

      assert.throws(
        () =>
          classifyTarget(file),
        /Save As.*Power BI Project.*\.pbip/i,
      );
    }
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

test('intake rejects unsupported file extensions explicitly', () => {
  const root = mkdtempSync(
    join(
      tmpdir(),
      'pbi-profiling-intake-invalid-',
    ),
  );
  const file =
    join(root, 'model.xlsx');

  try {
    mkdirSync(
      root,
      {
        recursive: true,
      },
    );

    writeFileSync(
      file,
      'not a Power BI artifact',
      'utf-8',
    );

    assert.throws(
      () =>
        classifyTarget(file),
      /Unsupported Power BI target/i,
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
