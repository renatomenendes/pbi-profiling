export function buildStructuralImportanceProfile(viewerModel, usage) {
  const measures = buildMeasureImportance(viewerModel, usage);
  const tables = buildTableImportance(viewerModel, usage, measures);

  return {
    methodology: {
      scope:
        'Structural importance estimates technical centrality from observable usage and dependency signals. It is not business value.',
      measureWeights: {
        visualBreadth: 0.35,
        pageBreadth: 0.25,
        reverseDependencyFanout: 0.25,
        transitiveDependencyFanout: 0.15,
      },
      tableWeights: {
        visualBreadth: 0.30,
        pageBreadth: 0.20,
        objectBreadth: 0.15,
        relationshipDegree: 0.15,
        dependentMeasureBreadth: 0.20,
      },
    },
    measures,
    tables,
    mostCentralMeasures: measures.slice(0, 20),
    mostCentralTables: tables.slice(0, 20),
  };
}

function buildMeasureImportance(viewerModel, usage) {
  const usageByKey = new Map(
    (usage.measures ?? []).map((item) => [key(item.table, item.name), item]),
  );
  const dependents = buildMeasureDependents(viewerModel.measures ?? []);
  const totalPages = Math.max(1, viewerModel.pages?.length ?? 0);
  const maximumVisuals = Math.max(
    1,
    ...[...(usage.measures ?? [])].map((item) => item.visualReferences ?? 0),
  );
  const maximumDirectDependents = Math.max(
    1,
    ...[...dependents.values()].map((items) => items.size),
  );

  const transitiveCounts = new Map();
  for (const measure of viewerModel.measures ?? []) {
    const objectKey = key(measure.table, measure.name);
    transitiveCounts.set(
      objectKey,
      collectTransitiveDependents(objectKey, dependents).size,
    );
  }
  const maximumTransitive = Math.max(1, ...transitiveCounts.values());

  return (viewerModel.measures ?? [])
    .map((measure) => {
      const objectKey = key(measure.table, measure.name);
      const observed = usageByKey.get(objectKey) ?? {};
      const directDependents = dependents.get(objectKey)?.size ?? 0;
      const transitiveDependents = transitiveCounts.get(objectKey) ?? 0;
      const components = {
        visualBreadth: normalize(observed.visualReferences ?? 0, maximumVisuals),
        pageBreadth: normalize(observed.pageReferences ?? 0, totalPages),
        reverseDependencyFanout: normalize(
          directDependents,
          maximumDirectDependents,
        ),
        transitiveDependencyFanout: normalize(
          transitiveDependents,
          maximumTransitive,
        ),
      };
      const score = round(
        components.visualBreadth * 0.35 +
          components.pageBreadth * 0.25 +
          components.reverseDependencyFanout * 0.25 +
          components.transitiveDependencyFanout * 0.15,
      );

      return {
        table: measure.table,
        name: measure.name,
        score,
        band: importanceBand(score),
        evidence: {
          visualReferences: observed.visualReferences ?? 0,
          pageReferences: observed.pageReferences ?? 0,
          directDependentMeasures: directDependents,
          transitiveDependentMeasures: transitiveDependents,
          observedActive: Boolean(observed.active),
        },
        components: roundObject(components),
      };
    })
    .sort(compareImportance);
}

function buildTableImportance(viewerModel, usage, measureImportance) {
  const usageByTable = new Map(
    (usage.tables ?? []).map((item) => [item.table, item]),
  );
  const relationshipDegree = new Map();
  for (const relationship of viewerModel.relationships ?? []) {
    increment(relationshipDegree, relationship.fromTable);
    increment(relationshipDegree, relationship.toTable);
  }

  const dependentMeasureCounts = new Map();
  for (const measure of viewerModel.measures ?? []) {
    const referencedTables = new Set([
      ...(measure.dependsOn?.tables ?? []),
      ...(measure.dependsOn?.columns ?? []).map(referenceTable),
      ...(measure.dependsOn?.measures ?? []).map(referenceTable),
    ].filter(Boolean));

    for (const tableName of referencedTables) {
      increment(dependentMeasureCounts, tableName);
    }
  }

  const tableMeasureImportance = new Map();
  for (const item of measureImportance) {
    const current = tableMeasureImportance.get(item.table) ?? [];
    current.push(item.score);
    tableMeasureImportance.set(item.table, current);
  }

  const totalPages = Math.max(1, viewerModel.pages?.length ?? 0);
  const maximumVisuals = Math.max(
    1,
    ...[...(usage.tables ?? [])].map((item) => item.visualReferences ?? 0),
  );
  const maximumObjectBreadth = Math.max(
    1,
    ...[...(usage.tables ?? [])].map(
      (item) =>
        (item.directlyUsedMeasures ?? 0) +
        (item.directlyUsedColumns ?? 0),
    ),
  );
  const maximumRelationshipDegree = Math.max(1, ...relationshipDegree.values());
  const maximumDependentMeasures = Math.max(1, ...dependentMeasureCounts.values());

  return (viewerModel.tables ?? [])
    .map((table) => {
      const observed = usageByTable.get(table.name) ?? {};
      const objectBreadth =
        (observed.directlyUsedMeasures ?? 0) +
        (observed.directlyUsedColumns ?? 0);
      const degree = relationshipDegree.get(table.name) ?? 0;
      const dependentMeasures = dependentMeasureCounts.get(table.name) ?? 0;
      const components = {
        visualBreadth: normalize(observed.visualReferences ?? 0, maximumVisuals),
        pageBreadth: normalize(observed.pageReferences ?? 0, totalPages),
        objectBreadth: normalize(objectBreadth, maximumObjectBreadth),
        relationshipDegree: normalize(degree, maximumRelationshipDegree),
        dependentMeasureBreadth: normalize(
          dependentMeasures,
          maximumDependentMeasures,
        ),
      };
      const score = round(
        components.visualBreadth * 0.30 +
          components.pageBreadth * 0.20 +
          components.objectBreadth * 0.15 +
          components.relationshipDegree * 0.15 +
          components.dependentMeasureBreadth * 0.20,
      );
      const measureScores = tableMeasureImportance.get(table.name) ?? [];

      return {
        table: table.name,
        score,
        band: importanceBand(score),
        evidence: {
          visualReferences: observed.visualReferences ?? 0,
          pageReferences: observed.pageReferences ?? 0,
          directlyUsedMeasures: observed.directlyUsedMeasures ?? 0,
          directlyUsedColumns: observed.directlyUsedColumns ?? 0,
          relationshipDegree: degree,
          dependentMeasures,
          maximumMeasureCentrality:
            measureScores.length > 0 ? Math.max(...measureScores) : 0,
        },
        components: roundObject(components),
      };
    })
    .sort(compareImportance);
}

function buildMeasureDependents(measures) {
  const dependents = new Map();
  const knownByName = new Map();

  for (const measure of measures) {
    const objectKey = key(measure.table, measure.name);
    dependents.set(objectKey, new Set());
    const foldedName = measure.name.toLocaleLowerCase('en-US');
    const entries = knownByName.get(foldedName) ?? [];
    entries.push(objectKey);
    knownByName.set(foldedName, entries);
  }

  for (const measure of measures) {
    const sourceKey = key(measure.table, measure.name);
    for (const reference of measure.dependsOn?.measures ?? []) {
      const parsed = splitReference(reference);
      let targetKey = null;
      if (parsed) {
        const candidate = key(parsed.table, parsed.name);
        if (dependents.has(candidate)) {
          targetKey = candidate;
        }
      }

      if (!targetKey) {
        const bare = bareReferenceName(reference).toLocaleLowerCase('en-US');
        const matches = knownByName.get(bare) ?? [];
        if (matches.length === 1) {
          targetKey = matches[0];
        }
      }

      if (targetKey) {
        dependents.get(targetKey)?.add(sourceKey);
      }
    }
  }

  return dependents;
}

function collectTransitiveDependents(start, dependents) {
  const found = new Set();
  const queue = [...(dependents.get(start) ?? [])];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || found.has(current)) {
      continue;
    }
    found.add(current);
    for (const next of dependents.get(current) ?? []) {
      if (!found.has(next)) {
        queue.push(next);
      }
    }
  }

  found.delete(start);
  return found;
}

function splitReference(reference) {
  const match = /^(.*?)\[(.*)\]$/s.exec(reference ?? '');
  if (!match) {
    return null;
  }
  return { table: match[1], name: match[2] };
}

function bareReferenceName(reference) {
  const parsed = splitReference(reference);
  return parsed?.name ?? String(reference ?? '').replace(/^\[|\]$/g, '');
}

function referenceTable(reference) {
  return splitReference(reference)?.table ?? null;
}

function key(table, name) {
  return `${table}\u0000${name}`;
}

function increment(map, keyName) {
  if (!keyName) {
    return;
  }
  map.set(keyName, (map.get(keyName) ?? 0) + 1);
}

function normalize(value, maximum) {
  const denominator = Number(maximum);
  const numerator = Number(value);
  if (!Number.isFinite(numerator) || numerator <= 0) {
    return 0;
  }
  if (!Number.isFinite(denominator) || denominator <= 0) {
    return 0;
  }
  return Math.min(1, numerator / denominator);
}

function importanceBand(score) {
  if (score >= 0.75) {
    return 'very-high';
  }
  if (score >= 0.50) {
    return 'high';
  }
  if (score >= 0.25) {
    return 'moderate';
  }
  return 'low';
}

function compareImportance(left, right) {
  return (
    right.score - left.score ||
    String(left.table).localeCompare(String(right.table)) ||
    String(left.name ?? '').localeCompare(String(right.name ?? ''))
  );
}

function roundObject(value) {
  return Object.fromEntries(
    Object.entries(value).map(([keyName, number]) => [keyName, round(number)]),
  );
}

function round(value) {
  return Math.round(Number(value) * 1000) / 1000;
}
