import { resolve } from 'node:path';

import { loadProfilingConfig } from '../config/load.js';
import { loadBusinessContext } from '../context/load.js';
import { analyzeProject } from '../engine/analyze.js';
import {
  writeJsonAtomic,
  writeTextAtomic,
} from '../export/files.js';
import { renderExtendedRagJsonl } from '../export/rag-extended.js';
import { prepareProfilingTarget } from '../intake/prepare.js';
import { buildProfile } from '../profile/build.js';
import { renderEnhancedReportHtml } from '../report/enhance.js';
import { renderLineageHtml } from '../report/lineage.js';

export async function profileTarget(
  targetPath,
  {
    outputDirectory,
    contextPath = null,
    configPath = null,
    keepWorkspace = false,
    desktopTimeoutMs = 300_000,
    projectNameOverride = null,
    onProgress = () => {},
  } = {},
) {
  if (!outputDirectory) {
    throw new Error('outputDirectory is required.');
  }

  const prepared = await prepareProfilingTarget(
    targetPath,
    {
      keepWorkspace,
      desktopTimeoutMs,
      onProgress,
    },
  );

  try {
    onProgress({
      phase: 'analyzing',
      message: 'Analyzing PBIP/TMDL/PBIR structure.',
    });

    const result = analyzeProject(prepared.projectRoot);
    result.projectName =
      String(projectNameOverride ?? '').trim() ||
      prepared.projectName ||
      result.projectName;

    const businessContext = loadBusinessContext(
      prepared.contextRoot,
      contextPath,
    );
    const profilingConfig = loadProfilingConfig(
      prepared.contextRoot,
      configPath,
    );

    const profile = buildProfile(
      result,
      {
        businessContext,
        profilingConfig,
      },
    );

    onProgress({
      phase: 'rendering',
      message: 'Rendering runbook, structured profile and RAG chunks.',
    });

    const lineageHtml = renderLineageHtml(profile);
    const reportHtml = renderEnhancedReportHtml({
      profile,
      lineageHtml,
    });
    const ragJsonl = renderExtendedRagJsonl(profile);

    const output = resolve(outputDirectory);
    const jsonFile = writeJsonAtomic(
      resolve(output, 'profile.json'),
      profile,
    );
    const htmlFile = writeTextAtomic(
      resolve(output, 'profile.html'),
      reportHtml,
    );
    const ragFile = writeTextAtomic(
      resolve(output, 'profile.rag.jsonl'),
      ragJsonl,
    );

    onProgress({
      phase: 'completed',
      message: 'Runbook generated successfully.',
    });

    return {
      profile,
      outputs: {
        html: htmlFile,
        json: jsonFile,
        rag: ragFile,
      },
      intake: prepared.summary,
      workspacePath:
        keepWorkspace && prepared.workspacePath
          ? prepared.workspacePath
          : null,
    };
  } finally {
    prepared.cleanup();
  }
}
