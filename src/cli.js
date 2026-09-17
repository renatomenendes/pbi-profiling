#!/usr/bin/env node

import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { analyzeProject } from './engine/analyze.js';
import { writeJson } from './export/json.js';
import { buildProfile } from './profile/build.js';

const USAGE = `
pbi-profiling profile <pbip-directory> --output <directory>

Build a read-only profile of a Power BI PBIP project.

Options:
  -o, --output <directory>  Required output directory.
  -h, --help                Show this help.
`.trim();

export function runCli(args = process.argv.slice(2)) {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    strict: true,
    options: {
      output: {
        type: 'string',
        short: 'o',
      },
      help: {
        type: 'boolean',
        short: 'h',
        default: false,
      },
    },
  });

  if (values.help) {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }

  const [command, target] = positionals;

  if (command !== 'profile' || !target) {
    throw new Error(
      `Invalid command.\n\n${USAGE}`,
    );
  }

  if (!values.output) {
    throw new Error(
      `--output is required.\n\n${USAGE}`,
    );
  }

  const result = analyzeProject(target);
  const profile = buildProfile(result);
  const outputDirectory = resolve(values.output);
  const outputFile = writeJson(
    resolve(outputDirectory, 'profile.json'),
    profile,
  );

  process.stdout.write(
    `${JSON.stringify(
      {
        project: profile.meta.projectName,
        model: profile.meta.modelName,
        report: profile.meta.reportName,
        output: outputFile,
        counts: profile.overview.counts,
        health: profile.health.counts,
        sourceResolutionCoverage:
          profile.health.sourceResolutionCoverage,
      },
      null,
      2,
    )}\n`,
  );

  return 0;
}

const isMainModule =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  try {
    process.exitCode = runCli();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`pbi-profiling: ${message}\n`);
    process.exitCode = 1;
  }
}
