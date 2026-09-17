import {
  readdirSync,
  statSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOTS = ['src', 'scripts', 'test'];

function collectJavaScriptFiles(root) {
  const files = [];

  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      files.push(...collectJavaScriptFiles(path));
    } else if (stats.isFile() && path.endsWith('.js')) {
      files.push(path);
    }
  }

  return files;
}

const files = ROOTS.flatMap((root) =>
  collectJavaScriptFiles(resolve(root)),
).sort();

for (const file of files) {
  const result = spawnSync(
    process.execPath,
    ['--check', file],
    {
      encoding: 'utf-8',
    },
  );

  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
}

process.stdout.write(`Syntax OK: ${files.length} JavaScript files\n`);
