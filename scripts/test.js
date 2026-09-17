import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

function collectTestFiles(root) {
  const files = [];

  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      files.push(...collectTestFiles(path));
      continue;
    }

    if (stats.isFile() && path.endsWith('.test.js')) {
      files.push(path);
    }
  }

  return files;
}

const testRoot = resolve('test');
const files = collectTestFiles(testRoot).sort();

if (files.length === 0) {
  process.stderr.write('No test files found under test/.\n');
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ['--test', ...files],
  {
    stdio: 'inherit',
  },
);

process.exit(result.status ?? 1);
