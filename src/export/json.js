import {
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';

export function writeJson(path, value) {
  const target = resolve(path);
  const directory = dirname(target);
  const temporary = `${target}.tmp-${process.pid}`;

  mkdirSync(directory, { recursive: true });

  try {
    writeFileSync(
      temporary,
      `${JSON.stringify(value, null, 2)}\n`,
      'utf-8',
    );

    if (existsSync(target)) {
      rmSync(target, { force: true });
    }

    renameSync(temporary, target);
  } finally {
    if (existsSync(temporary)) {
      rmSync(temporary, { force: true });
    }
  }

  return target;
}
