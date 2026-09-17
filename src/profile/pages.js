function normalizePath(path) {
  return String(path ?? '').replaceAll('\\', '/');
}

function isPageDefinition(path) {
  const normalized = normalizePath(path);
  return /(?:^|\/)pages\/[^/]+\/page\.json$/i.test(normalized);
}

function pageIdFromPath(path) {
  const normalized = normalizePath(path);
  const match = /(?:^|\/)pages\/([^/]+)\/page\.json$/i.exec(normalized);
  return match?.[1] ?? null;
}

function parsePage(path, content) {
  const pageId = pageIdFromPath(path);

  try {
    const data = JSON.parse(content);
    const visibility = data.visibility ?? 'Visible';

    return {
      id: pageId ?? data.name ?? null,
      name: data.displayName ?? data.name ?? pageId ?? 'Unnamed page',
      visibility,
      isHidden:
        data.isHidden === true ||
        String(visibility).toLowerCase() !== 'visible',
      pageType: data.pageBinding?.type ?? null,
      width: data.width ?? data.defaultSize?.width ?? null,
      height: data.height ?? data.defaultSize?.height ?? null,
      ordinal: data.ordinal ?? data.order ?? null,
      sourcePath: normalizePath(path),
      parseError: null,
    };
  } catch (error) {
    return {
      id: pageId,
      name: pageId ?? 'Unparsed page',
      visibility: null,
      isHidden: null,
      pageType: null,
      width: null,
      height: null,
      ordinal: null,
      sourcePath: normalizePath(path),
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
}

export function extractPageMetadata(reportFiles) {
  if (!(reportFiles instanceof Map)) {
    return [];
  }

  return [...reportFiles.entries()]
    .filter(([path]) => isPageDefinition(path))
    .map(([path, content]) => parsePage(path, content))
    .sort((left, right) => {
      const leftOrder = left.ordinal ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = right.ordinal ?? Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder || left.name.localeCompare(right.name);
    });
}
