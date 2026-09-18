export function summarizeAnalyzedProject(
  result,
) {
  const modelFiles =
    result.inputSummary?.modelFiles ?? 0;
  const tmdlFiles =
    result.inputSummary?.tmdlFiles ?? 0;
  const reportFiles =
    result.inputSummary?.reportFiles ?? 0;

  return {
    projectName:
      result.projectName ?? null,
    modelName:
      result.partition?.modelName ?? null,
    reportName:
      result.partition?.reportName ?? null,
    modelFiles,
    tmdlFiles,
    reportFiles,
    tables:
      result.viewerModel?.tables?.length ?? 0,
    columns:
      result.viewerModel?.columns?.length ?? 0,
    measures:
      result.viewerModel?.measures?.length ?? 0,
    relationships:
      result.viewerModel?.relationships?.length ?? 0,
    pages:
      result.viewerModel?.pages?.length ??
      result.pageMetadata?.length ??
      0,
    visuals:
      result.viewerModel?.visuals?.length ?? 0,
  };
}

export function assertAnalyzedProjectIsProfileable(
  result,
  {
    expected = null,
    source = 'PBIP project',
  } = {},
) {
  const summary =
    summarizeAnalyzedProject(result);

  if (summary.tmdlFiles < 1) {
    throw new Error(
      `${source} is not profileable: no TMDL files were found in the semantic model definition.`,
    );
  }

  if (summary.tables < 1) {
    throw new Error(
      `${source} is not profileable: TMDL was found, but no model tables were parsed.`,
    );
  }

  const expectedTables =
    Number(expected?.modelTableCount ?? 0);
  if (
    expectedTables > 0 &&
    summary.tables < 1
  ) {
    throw new Error(
      `${source} lost the semantic model during conversion: Desktop exposed ${expectedTables} table(s), but the generated PBIP contains none.`,
    );
  }

  const expectedPages =
    Number(expected?.pageCount ?? 0);
  if (
    expectedPages > 0 &&
    summary.pages < 1
  ) {
    throw new Error(
      `${source} lost the report definition during conversion: the PBIX contained ${expectedPages} page(s), but the generated PBIP contains none.`,
    );
  }

  const expectedVisuals =
    Number(expected?.visualCount ?? 0);
  if (
    expectedVisuals > 0 &&
    summary.visuals < 1
  ) {
    throw new Error(
      `${source} lost report visuals during conversion: the PBIX contained ${expectedVisuals} visual(s), but the generated PBIP contains none.`,
    );
  }

  return {
    ready: true,
    ...summary,
  };
}
