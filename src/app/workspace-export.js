import {
  existsSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import { cp, mkdir } from 'node:fs/promises';
import {
  isAbsolute,
  resolve,
  sep,
} from 'node:path';

export function listWorkspaceFiles(
  root,
) {
  const workspaceRoot = resolve(root);
  const files = [];

  const walk = (
    directory,
    prefix,
  ) => {
    for (
      const entry of readdirSync(
        directory,
        {
          withFileTypes: true,
        },
      )
    ) {
      const fullPath = resolve(
        directory,
        entry.name,
      );
      const relativePath =
        prefix
          ? `${prefix}/${entry.name}`
          : entry.name;

      if (entry.isDirectory()) {
        walk(
          fullPath,
          relativePath,
        );
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const stats = statSync(fullPath);

      files.push({
        path: relativePath.replaceAll('\\', '/'),
        bytes: stats.size,
      });
    }
  };

  walk(
    workspaceRoot,
    '',
  );

  return files.sort(
    (left, right) =>
      left.path.localeCompare(right.path),
  );
}

export async function exportWorkspaceToDirectory(
  workspaceRoot,
  destinationRoot,
  projectName,
) {
  const source = resolve(workspaceRoot);
  const requestedDestination =
    String(destinationRoot ?? '').trim();

  if (!requestedDestination) {
    throw new Error(
      'A destination directory is required to save the converted PBIP.',
    );
  }

  if (!isAbsolute(requestedDestination)) {
    throw new Error(
      'The converted PBIP destination must be an absolute path.',
    );
  }

  const base = resolve(
    requestedDestination,
  );

  if (
    source === base ||
    source.startsWith(
      base.endsWith(sep)
        ? base
        : `${base}${sep}`,
    )
  ) {
    throw new Error(
      'The converted PBIP destination cannot contain the temporary conversion workspace.',
    );
  }

  await mkdir(
    base,
    {
      recursive: true,
    },
  );

  const safeProjectName =
    sanitizeFolderName(projectName);
  const target =
    await createUniqueDirectory(
      base,
      `${safeProjectName}-PBIP`,
    );

  try {
    await cp(
      source,
      target,
      {
        recursive: true,
        errorOnExist: true,
        force: false,
      },
    );
  } catch (error) {
    rmSync(
      target,
      {
        recursive: true,
        force: true,
      },
    );
    throw error;
  }

  const files =
    listWorkspaceFiles(target);

  if (files.length === 0) {
    rmSync(
      target,
      {
        recursive: true,
        force: true,
      },
    );
    throw new Error(
      'The converted PBIP export completed without files.',
    );
  }

  return {
    path: target,
    fileCount: files.length,
    totalBytes:
      files.reduce(
        (sum, item) =>
          sum + item.bytes,
        0,
      ),
  };
}

export function resolveWorkspaceFile(
  root,
  relativePath,
) {
  const workspaceRoot = resolve(root);
  const normalized =
    normalizeRelativePath(relativePath);
  const destination = resolve(
    workspaceRoot,
    ...normalized.split('/'),
  );
  const prefix =
    workspaceRoot.endsWith(sep)
      ? workspaceRoot
      : `${workspaceRoot}${sep}`;

  if (!destination.startsWith(prefix)) {
    throw new Error(
      'Workspace file path escapes the conversion workspace.',
    );
  }

  return destination;
}

export function removeWorkspace(
  root,
) {
  rmSync(
    resolve(root),
    {
      recursive: true,
      force: true,
    },
  );
}

async function createUniqueDirectory(
  parent,
  baseName,
) {
  for (
    let suffix = 1;
    suffix <= 10_000;
    suffix += 1
  ) {
    const folderName =
      suffix === 1
        ? baseName
        : `${baseName}-${suffix}`;
    const candidate = resolve(
      parent,
      folderName,
    );

    if (existsSync(candidate)) {
      continue;
    }

    try {
      await mkdir(
        candidate,
        {
          recursive: false,
        },
      );
      return candidate;
    } catch (error) {
      if (error?.code === 'EEXIST') {
        continue;
      }
      throw error;
    }
  }

  throw new Error(
    'Could not allocate a unique destination folder for the converted PBIP.',
  );
}

function sanitizeFolderName(
  value,
) {
  const sanitized = String(
    value ?? 'PowerBI',
  )
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
    .replace(/[. ]+$/g, '')
    .trim();

  return sanitized || 'PowerBI';
}

function normalizeRelativePath(
  value,
) {
  const normalized = String(value ?? '')
    .replaceAll('\\', '/')
    .replace(/^\/+/, '')
    .trim();

  if (!normalized) {
    throw new Error(
      'Workspace file path is required.',
    );
  }

  if (
    normalized.includes('\u0000') ||
    /^[A-Za-z]:/.test(normalized)
  ) {
    throw new Error(
      'Workspace file path must be relative.',
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
      'Workspace file path contains an unsafe segment.',
    );
  }

  return parts.join('/');
}
