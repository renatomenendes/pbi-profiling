#!/usr/bin/env node

import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { profileTarget } from './application/profile.js';
import { buildCliSummary } from './application/summary.js';

const USAGE = `
pbi-profiling profile <power-bi-target> --output <directory> [options]

Accepted targets:
  <project-folder>      PBIP project folder.
  <file.pbip>           PBIP project index file.
  <folder.SemanticModel> or <folder.Report>
  <file.pbix>           Windows only. Uses the already-installed Power BI
                        Desktop engine to materialize a temporary PBIP/TMDL
                        project before profiling.

Runtime requirements:
  Node.js 20+ and the repository cloned with its Git submodule.
  No npm install is required for profiling execution.

PBIX requirements:
  Windows + an existing Power BI Desktop installation.
  No Python, package installation, elevation or ExecutionPolicy change is used.
  Current direct intake requires PBIX files with embedded PBIR report
  definitions. Legacy Report/Layout PBIX files fail explicitly rather than
  being approximated.

Outputs:
  profile.html       Human-oriented offline runbook.
  profile.json       Structured profiling contract.
  profile.rag.jsonl  Retrieval-ready chunks for AI/RAG workflows.

Optional business context:
  If --context is omitted, pbi-profiling looks next to the original target for
  pbi-profiling.context.json. Absence is valid.

Optional profiling configuration:
  If --config is omitted, pbi-profiling looks next to the original target for
  pbi-profiling.config.json. Absence is valid.

Options:
  -o, --output <directory>       Required output directory.
  -c, --context <file>           Optional business-context sidecar.
  -g, --config <file>            Optional profiling/semantic configuration.
      --keep-workspace           Preserve temporary PBIP created from PBIX.
      --desktop-timeout <sec>    Wait limit for PBIX model loading. Default 300.
  -h, --help                     Show this help.

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
      'keep-workspace': {
        type: 'boolean',
        default: false,
      },
      'desktop-timeout': {
        type: 'string',
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
      `${USAGE}\n`,
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
      `Invalid command.\n\n${USAGE}`,
    );
  }

  if (!values.output) {
    throw new Error(
      `--output is required.\n\n${USAGE}`,
    );
  }

  const desktopTimeoutSeconds =
    parsePositiveNumber(
      values['desktop-timeout'],
      300,
    );

  const result = await profileTarget(
    target,
    {
      outputDirectory: values.output,
      contextPath:
        values.context ?? null,
      configPath:
        values.config ?? null,
      keepWorkspace:
        values['keep-workspace'],
      desktopTimeoutMs:
        desktopTimeoutSeconds * 1000,
    },
  );

  process.stdout.write(
    `${JSON.stringify(
      buildCliSummary(result),
      null,
      2,
    )}\n`,
  );

  return 0;
}

function parsePositiveNumber(
  value,
  fallback,
) {
  if (value == null) {
    return fallback;
  }

  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed <= 0
  ) {
    throw new Error(
      `Expected a positive number, received: ${value}`,
    );
  }

  return parsed;
}

const isMainModule =
  Boolean(process.argv[1]) &&
  import.meta.url ===
    pathToFileURL(process.argv[1]).href;

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
      `pbi-profiling: ${message}\n`,
    );
    process.exitCode = 1;
  }
}
