#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

import { startLocalApp } from './app/server.js';

export async function runApp() {
  const app = await startLocalApp();

  process.stdout.write(
    [
      'pbi-profiling local app',
      app.url,
      'Press Ctrl+C to stop. Temporary UI files are deleted on shutdown.',
      '',
    ].join('\n'),
  );

  const shutdown = async () => {
    try {
      await app.close();
    } finally {
      process.exit(0);
    }
  };

  process.once(
    'SIGINT',
    shutdown,
  );
  process.once(
    'SIGTERM',
    shutdown,
  );

  return app;
}

const isMainModule =
  Boolean(process.argv[1]) &&
  import.meta.url ===
    pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  try {
    await runApp();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    process.stderr.write(
      `pbi-profiling app: ${message}\n`,
    );
    process.exitCode = 1;
  }
}
