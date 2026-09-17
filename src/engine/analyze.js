import { analyzeFromFiles } from '@pbi-lineage-lenz/core';
import { toViewerModel } from '@pbi-lineage-lenz/viewer';

import { loadProject } from '../io/project.js';
import { extractPageMetadata } from '../profile/pages.js';

export function analyzeProject(targetPath) {
  const loaded = loadProject(targetPath);
  const { partition } = loaded;

  const analysis = analyzeFromFiles({
    modelFiles: partition.modelFiles,
    reportFiles: partition.reportFiles ?? undefined,
  });

  const viewerModel = toViewerModel(analysis, {
    modelName: partition.modelName ?? loaded.projectName,
    reportName: partition.reportName ?? null,
    projectPath: loaded.root,
  });

  return {
    targetPath: loaded.root,
    projectName: loaded.projectName,
    note: loaded.note,
    partition: {
      modelName: partition.modelName ?? null,
      reportName: partition.reportName ?? null,
    },
    pageMetadata: extractPageMetadata(partition.reportFiles),
    analysis,
    viewerModel,
  };
}
