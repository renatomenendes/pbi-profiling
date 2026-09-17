/**
 * Project reader adapted from pbi-lineage-lenz/packages/cli/src/readProject.js.
 *
 * Upstream: https://github.com/JonathanJihwanKim/pbi-lineage-lenz
 * Evaluated commit: 7e2c61cac2f5e0ca6e7135df17a6918c89c42aec
 * License: MIT, Copyright (c) Jihwan Kim.
 *
 * Local changes: reduced to the read-only local-folder contract used by
 * pbi-profiling and normalized diagnostics for this CLI.
 */

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { basename, join, resolve } from 'node:path';

import {
  describeChoice,
  describeProblem,
  partitionPbip,
  shouldRead,
} from '../../vendor/pbi-lineage-lenz/packages/core/src/index.js';

export function readProjectFolder(root) {
  const files = new Map();
  const absoluteRoot = resolve(root);

  const walk = (directory, prefix) => {
    for (const entry of readdirSync(directory)) {
      const fullPath = join(directory, entry);
      const relativePath = prefix ? `${prefix}/${entry}` : entry;

      let stats;
      try {
        stats = statSync(fullPath);
      } catch {
        continue;
      }

      if (stats.isDirectory()) {
        if (shouldRead(`${relativePath}/probe.tmdl`)) {
          walk(fullPath, relativePath);
        }
        continue;
      }

      if (stats.isFile() && shouldRead(relativePath)) {
        files.set(
          relativePath.replaceAll('\\', '/'),
          readFileSync(fullPath, 'utf-8'),
        );
      }
    }
  };

  walk(absoluteRoot, '');
  return files;
}

export function loadProject(targetPath) {
  const root = resolve(targetPath);

  if (!existsSync(root)) {
    throw new Error(`Project folder does not exist: ${targetPath}`);
  }

  if (!statSync(root).isDirectory()) {
    throw new Error(
      `Project target must be a folder, received: ${targetPath}`,
    );
  }

  const files = readProjectFolder(root);
  const partition = partitionPbip(files);
  const problem = describeProblem(partition);

  if (problem) {
    throw new Error(problem);
  }

  return {
    root,
    files,
    partition,
    note: describeChoice(partition),
    projectName: basename(root),
  };
}
