import {
  rmSync,
} from 'node:fs';

import { analyzeProject } from '../engine/analyze.js';
import {
  prepareProfilingTarget,
} from '../intake/prepare.js';
import {
  assertAnalyzedProjectIsProfileable,
} from './validation.js';

export async function convertPbixTarget(
  targetPath,
  {
    desktopTimeoutMs = 300_000,
    onProgress = () => {},
  } = {},
) {
  const prepared =
    await prepareProfilingTarget(
      targetPath,
      {
        keepWorkspace: true,
        desktopTimeoutMs,
        onProgress,
      },
    );

  if (!prepared.converted) {
    throw new Error(
      'PBIX conversion requires a .pbix input.',
    );
  }

  try {
    onProgress({
      phase: 'validating-conversion',
      message:
        'Validating converted PBIP before it can be saved.',
    });

    const analyzed =
      analyzeProject(
        prepared.projectRoot,
      );
    const validation =
      assertAnalyzedProjectIsProfileable(
        analyzed,
        {
          expected:
            prepared.conversion ?? null,
          source:
            'Converted PBIP',
        },
      );

    return {
      projectName:
        prepared.projectName,
      workspacePath:
        prepared.workspacePath,
      projectRoot:
        prepared.projectRoot,
      conversion:
        prepared.conversion,
      intake:
        prepared.summary,
      validation,
    };
  } catch (error) {
    if (prepared.workspacePath) {
      rmSync(
        prepared.workspacePath,
        {
          recursive: true,
          force: true,
        },
      );
    }
    throw error;
  }
}
