#!/usr/bin/env node

import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { profileTarget } from './application/profile.js';
import { buildCliSummary } from './application/summary.js';

const USAGE = `
pbi-profiling profile <pbip-target> --output <directory> [options]

Accepted targets:
  <project-folder>      PBIP project folder.
  <file.pbip>           PBIP project index file.
  <folder.SemanticModel> or <folder.Report>

PBIX/PBIT:
  Save the file from Power BI Desktop as Power BI Project (.pbip) first.
  Direct PBIX-to-PBIP conversion is intentionally not part of the profiler.

Runtime requirements:
  Node.js 20+ and the repository cloned with its Git submodule.
  No npm install is required for profiling execution.

Outputs:
  profile.html       Human-oriented offline runbook.
  profile.json       Structured profiling contract.
  profile.rag.jsonl  Retrieval-ready chunks for AI/RAG workflows.

Optional business context:
  If --context is omitted, pbi-profiling looks next to the target for
  pbi-profiling.context.json. Absence is valid.

Optional profiling configuration:
  If --config is omitted, pbi-profiling looks next to the target for
  pbi-profiling.config.json. Absence is valid.

Options:
  -o, --output <directory>  Required output directory.
  -c, --context <file>      Optional business-context sidecar.
  -g, --config <file>       Optional profiling/semantic configuration.
  -h, --help                Show this help.

Local UI:
  node .\\src\\app.js
`.trim();

export async function runCli(
  args = process.argv.slice(2),
) {
  const {
    values,
    positionals,
  } = parseArgs({
    args,
    allowPositionals: true,
    strict: true,
    options: {
      output: {
        type: 'string',
        short: 'o',
      },
      context: {
        type: 'string',
        short: 'c',
      },
      config: {
        type: 'string',
        short: 'g',
      },
      help: {
        type: 'boolean',
        short: 'h',
        default: false,
      },
    },
  });

  if (values.help) {
    process.stdout.write(
      USAGE + '\n',
    );
    return 0;
  }

  const [
    command,
    target,
  ] = positionals;

  if (
    command !== 'profile' ||
    !target
  ) {
    throw new Error(
      'Invalid command.\n\n' +
      USAGE,
    );
  }

  if (!values.output) {
    throw new Error(
      '--output is required.\n\n' +
      USAGE,
    );
  }

  const result =
    await profileTarget(
      target,
      {
        outputDirectory:
          values.output,
        contextPath:
          values.context ?? null,
        configPath:
          values.config ?? null,
      },
    );

  process.stdout.write(
    JSON.stringify(
      buildCliSummary(result),
      null,
      2,
    ) + '\n',
  );

  return 0;
}

const isMainModule =
  Boolean(process.argv[1]) &&
  import.meta.url ===
    pathToFileURL(
      process.argv[1],
    ).href;

if (isMainModule) {
  try {
    process.exitCode =
      await runCli();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    process.stderr.write(
      'pbi-profiling: ' +
      message +
      '\n',
    );
    process.exitCode = 1;
  }
}
