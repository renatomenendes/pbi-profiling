import {
  existsSync,
  mkdtempSync,
  rmSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import {
  basename,
  dirname,
  extname,
  join,
  resolve,
} from 'node:path';

import { convertPbixToPbip } from './pbix.js';

export function classifyTarget(targetPath) {
  const target = resolve(targetPath);

  if (!existsSync(target)) {
    throw new Error(`Power BI target does not exist: ${targetPath}`);
  }

  const stats = statSync(target);

  if (stats.isDirectory()) {
    const folderName = basename(target);
    const lower = folderName.toLowerCase();

    if (lower.endsWith('.semanticmodel')) {
      return {
        kind: 'semantic-model-folder',
        sourcePath: target,
        projectRoot: dirname(target),
        contextRoot: dirname(target),
        projectName: folderName.slice(0, -'.SemanticModel'.length),
      };
    }

    if (lower.endsWith('.report')) {
      return {
        kind: 'report-folder',
        sourcePath: target,
        projectRoot: dirname(target),
        contextRoot: dirname(target),
        projectName: folderName.slice(0, -'.Report'.length),
      };
    }

    return {
      kind: 'pbip-folder',
      sourcePath: target,
      projectRoot: target,
      contextRoot: target,
      projectName: basename(target),
    };
  }

  if (!stats.isFile()) {
    throw new Error(`Unsupported Power BI target: ${targetPath}`);
  }

  const extension = extname(target).toLowerCase();

  if (extension === '.pbip') {
    return {
      kind: 'pbip-file',
      sourcePath: target,
      projectRoot: dirname(target),
      contextRoot: dirname(target),
      projectName: basename(target, extname(target)),
    };
  }

  if (extension === '.pbix') {
    return {
      kind: 'pbix-file',
      sourcePath: target,
      projectRoot: null,
      contextRoot: dirname(target),
      projectName: basename(target, extname(target)),
    };
  }

  throw new Error(
    `Unsupported Power BI target '${targetPath}'. Expected a PBIP project folder, .pbip file, .SemanticModel/.Report folder, or .pbix file.`,
  );
}

export async function prepareProfilingTarget(
  targetPath,
  {
    keepWorkspace = false,
    desktopTimeoutMs = 300_000,
    onProgress = () => {},
  } = {},
) {
  const classified = classifyTarget(targetPath);

  if (classified.kind !== 'pbix-file') {
    return {
      ...classified,
      converted: false,
      temporaryWorkspace: false,
      workspacePath: null,
      cleanup() {},
      summary: {
        kind: classified.kind,
        converted: false,
        temporaryWorkspace: false,
        workspaceKept: false,
      },
    };
  }

  if (process.platform !== 'win32') {
    throw new Error(
      'PBIX intake requires Windows because the semantic model is serialized through the locally installed Power BI Desktop Analysis Services engine.',
    );
  }

  const workspace = mkdtempSync(
    join(tmpdir(), 'pbi-profiling-pbix-'),
  );

  let converted;
  try {
    onProgress({
      phase: 'converting-pbix',
      message: 'Preparing temporary PBIP workspace from PBIX.',
    });

    converted = await convertPbixToPbip(
      classified.sourcePath,
      workspace,
      {
        projectName: classified.projectName,
        timeoutMs: desktopTimeoutMs,
        onProgress,
      },
    );
  } catch (error) {
    rmSync(workspace, {
      recursive: true,
      force: true,
    });
    throw error;
  }

  let cleaned = false;
  const cleanup = () => {
    if (cleaned || keepWorkspace) {
      return;
    }
    cleaned = true;
    rmSync(workspace, {
      recursive: true,
      force: true,
    });
  };

  return {
    ...classified,
    projectRoot: converted.projectRoot,
    converted: true,
    temporaryWorkspace: true,
    workspacePath: workspace,
    conversion: converted,
    cleanup,
    summary: {
      kind: classified.kind,
      converted: true,
      temporaryWorkspace: true,
      workspaceKept: Boolean(keepWorkspace),
      reportFormat: converted.reportFormat,
      modelStatus: converted.modelStatus,
      desktopOpened: Boolean(converted.desktopOpened),
      modelTableCount: converted.modelTableCount ?? null,
    },
  };
}
