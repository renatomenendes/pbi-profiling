import {
  existsSync,
  statSync,
} from 'node:fs';
import {
  basename,
  dirname,
  extname,
  resolve,
} from 'node:path';

export function classifyTarget(
  targetPath,
) {
  const target =
    resolve(targetPath);

  if (!existsSync(target)) {
    throw new Error(
      'Power BI target does not exist: ' +
      targetPath,
    );
  }

  const stats = statSync(target);

  if (stats.isDirectory()) {
    const folderName =
      basename(target);
    const lower =
      folderName.toLowerCase();

    if (
      lower.endsWith(
        '.semanticmodel',
      )
    ) {
      return {
        kind:
          'semantic-model-folder',
        sourcePath: target,
        projectRoot:
          dirname(target),
        contextRoot:
          dirname(target),
        projectName:
          folderName.slice(
            0,
            -'.SemanticModel'.length,
          ),
      };
    }

    if (
      lower.endsWith('.report')
    ) {
      return {
        kind: 'report-folder',
        sourcePath: target,
        projectRoot:
          dirname(target),
        contextRoot:
          dirname(target),
        projectName:
          folderName.slice(
            0,
            -'.Report'.length,
          ),
      };
    }

    return {
      kind: 'pbip-folder',
      sourcePath: target,
      projectRoot: target,
      contextRoot: target,
      projectName:
        basename(target),
    };
  }

  if (!stats.isFile()) {
    throw new Error(
      'Unsupported Power BI target: ' +
      targetPath,
    );
  }

  const extension =
    extname(target).toLowerCase();

  if (extension === '.pbip') {
    return {
      kind: 'pbip-file',
      sourcePath: target,
      projectRoot:
        dirname(target),
      contextRoot:
        dirname(target),
      projectName:
        basename(
          target,
          extname(target),
        ),
    };
  }

  if (
    extension === '.pbix' ||
    extension === '.pbit'
  ) {
    throw new Error(
      'Profiling requires PBIP. Open the file in Power BI Desktop and use File > Save As > Power BI Project (.pbip), then profile the saved PBIP project.',
    );
  }

  throw new Error(
    "Unsupported Power BI target '" +
    targetPath +
    "'. Expected a PBIP project folder, .pbip file, or .SemanticModel/.Report folder.",
  );
}

export async function prepareProfilingTarget(
  targetPath,
) {
  const classified =
    classifyTarget(targetPath);

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
