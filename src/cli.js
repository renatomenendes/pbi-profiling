#!/usr/bin/env node

import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { loadBusinessContext } from './context/load.js';
import { analyzeProject } from './engine/analyze.js';
import {
  writeJsonAtomic,
  writeTextAtomic,
} from './export/files.js';
import { renderExtendedRagJsonl } from './export/rag-extended.js';
import { buildProfile } from './profile/build.js';
import { renderEnhancedReportHtml } from './report/enhance.js';
import { renderLineageHtml } from './report/lineage.js';

const USAGE = `
pbi-profiling profile <pbip-directory> --output <directory> [--context <file>]

Build a read-only, self-contained profile of a Power BI PBIP project.

Runtime requirements:
  Node.js 20+ and the repository cloned with its Git submodule.
  No npm install is required for profiling execution.

Outputs:
  profile.html       Human-oriented offline runbook.
  profile.json       Structured profiling contract.
  profile.rag.jsonl  Retrieval-ready chunks for AI/RAG workflows.

Optional business context:
  If --context is omitted, pbi-profiling looks for
  <pbip-directory>/pbi-profiling.context.json. Absence is valid and never
  causes business meaning to be fabricated.

Options:
  -o, --output <directory>  Required output directory.
  -c, --context <file>      Optional business-context sidecar.
  -h, --help                Show this help.
`.trim();

export async function runCli(args = process.argv.slice(2)) {
  const { values, positionals } = parseArgs({
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
  const businessContext = loadBusinessContext(
    result.targetPath,
    values.context ?? null,
  );
  const profile = buildProfile(result, {
    businessContext,
  });
  const lineageHtml = renderLineageHtml(profile);
  const reportHtml = renderEnhancedReportHtml({
    profile,
    lineageHtml,
  });
  const ragJsonl = renderExtendedRagJsonl(profile);
  const outputDirectory = resolve(values.output);
  const jsonFile = writeJsonAtomic(
    resolve(outputDirectory, 'profile.json'),
    profile,
  );
  const htmlFile = writeTextAtomic(
    resolve(outputDirectory, 'profile.html'),
    reportHtml,
  );
  const ragFile = writeTextAtomic(
    resolve(outputDirectory, 'profile.rag.jsonl'),
    ragJsonl,
  );

  process.stdout.write(
    `${JSON.stringify(
      {
        project: profile.meta.projectName,
        model: profile.meta.modelName,
        report: profile.meta.reportName,
        outputs: {
          html: htmlFile,
          json: jsonFile,
          rag: ragFile,
        },
        counts: profile.overview.counts,
        health: profile.health.counts,
        sourceResolution: {
          physicalColumnCoverage:
            profile.sourceResolution.summary.physicalColumnCoverage,
          resourceLineageCoverage:
            profile.sourceResolution.summary.resourceLineageCoverage,
          physicalColumnResolved:
            profile.sourceResolution.summary.physicalColumnResolved,
          resourceResolved:
            profile.sourceResolution.summary.resourceResolved,
          unresolvedColumns:
            profile.sourceResolution.summary.unresolvedColumns,
          computedColumns:
            profile.sourceResolution.summary.computedColumns,
        },
        complexity: profile.complexity.combined,
        maintenance: profile.maintenance.summary,
        context: {
          status: profile.context.status,
          source: profile.context.source,
          warnings: profile.context.warnings.length,
        },
        analyticalOpportunities:
          profile.analytical.opportunities.filter(
            (item) => item.status !== 'insufficient-structural-evidence',
          ).length,
        lineageWarnings: [],
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
    process.exitCode = await runCli();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`pbi-profiling: ${message}\n`);
    process.exitCode = 1;
  }
}
