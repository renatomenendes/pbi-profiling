import { analyzeFromFiles } from '../../vendor/pbi-lineage-lenz/packages/core/src/index.js';
import { toViewerModel } from '../../vendor/pbi-lineage-lenz/packages/viewer/src/viewerModel.js';

import { loadProject } from '../io/project.js';
import { extractPageMetadata } from '../profile/pages.js';

export function analyzeProject(targetPath) {
  const loaded = loadProject(targetPath);
  const { partition } = loaded;

  const analysis = analyzeFromFiles({
    modelFiles: partition.modelFiles,
    reportFiles: partition.reportFiles ?? undefined,
  });

  const modelPaths = [
    ...partition.modelFiles.keys(),
  ];
  const reportPaths = [
    ...(partition.reportFiles?.keys() ?? []),
  ];

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
    inputSummary: {
      modelFiles: partition.modelFiles.size,
      tmdlFiles: modelPaths.filter(
        (path) =>
          path.toLowerCase().endsWith('.tmdl'),
      ).length,
      reportFiles:
        partition.reportFiles?.size ?? 0,
      reportJsonFiles: reportPaths.filter(
        (path) =>
          path.toLowerCase().endsWith('.json'),
      ).length,
    },
    pageMetadata: extractPageMetadata(partition.reportFiles),
    analysis,
    viewerModel,
  };
}
