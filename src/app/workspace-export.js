import {
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import {
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

export function resolveWorkspaceFile(
  root,
  relativePath,
) {
  const workspaceRoot = resolve(root);
  const normalized = normalizeRelativePath(
    relativePath,
  );
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
