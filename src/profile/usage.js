function objectKey(table, name) {
  return `${table}\u0000${name}`;
}

function splitReference(reference) {
  const match = /^(.*?)\[(.*)\]$/s.exec(reference ?? '');
  if (!match) {
    return null;
  }

  return {
    table: match[1],
    name: match[2],
  };
}

function ensureUsage(map, table, name, kind) {
  const key = objectKey(table, name);

  if (!map.has(key)) {
    map.set(key, {
      kind,
      table,
      name,
      visualIds: new Set(),
      pageIds: new Set(),
      roles: new Set(),
      vias: new Set(),
      referencedByMeasures: new Set(),
    });
  }

  return map.get(key);
}

export function buildUsageProfile(viewerModel) {
  const measures = new Map();
  const columns = new Map();
  const tables = new Map();

  for (const measure of viewerModel.measures ?? []) {
    ensureUsage(measures, measure.table, measure.name, 'measure');
  }

  for (const column of viewerModel.columns ?? []) {
    ensureUsage(columns, column.table, column.name, 'column');
  }

  for (const table of viewerModel.tables ?? []) {
    tables.set(table.name, {
      table: table.name,
      visualIds: new Set(),
      pageIds: new Set(),
      measures: new Set(),
      columns: new Set(),
    });
  }

  for (const visual of viewerModel.visuals ?? []) {
    const visualId = visual.key ?? visual.id;
    const pageId = visual.page;

    for (const field of visual.fields ?? []) {
      if (!field.table || !field.name) {
        continue;
      }

      const targetMap = field.kind === 'measure' ? measures : columns;
      const usage = ensureUsage(
        targetMap,
        field.table,
        field.name,
        field.kind,
      );

      usage.visualIds.add(visualId);
      if (pageId) {
        usage.pageIds.add(pageId);
      }
      if (field.role) {
        usage.roles.add(field.role);
      }
      if (field.via) {
        usage.vias.add(field.via);
      }

      const tableUsage = tables.get(field.table);
      if (tableUsage) {
        tableUsage.visualIds.add(visualId);
        if (pageId) {
          tableUsage.pageIds.add(pageId);
        }

        if (field.kind === 'measure') {
          tableUsage.measures.add(field.name);
        } else {
          tableUsage.columns.add(field.name);
        }
      }
    }
  }

  for (const measure of viewerModel.measures ?? []) {
    for (const reference of measure.dependsOn?.measures ?? []) {
      const target = splitReference(reference);
      if (!target) {
        continue;
      }

      const usage = measures.get(objectKey(target.table, target.name));
      if (usage) {
        usage.referencedByMeasures.add(
          objectKey(measure.table, measure.name),
        );
      }
    }

    for (const reference of measure.dependsOn?.columns ?? []) {
      const target = splitReference(reference);
      if (!target) {
        continue;
      }

      const usage = columns.get(objectKey(target.table, target.name));
      if (usage) {
        usage.referencedByMeasures.add(
          objectKey(measure.table, measure.name),
        );
      }
    }
  }

  const serializeObjectUsage = (usage) => ({
    kind: usage.kind,
    table: usage.table,
    name: usage.name,
    visualReferences: usage.visualIds.size,
    pageReferences: usage.pageIds.size,
    roles: [...usage.roles].sort(),
    vias: [...usage.vias].sort(),
    referencedByMeasures: usage.referencedByMeasures.size,
    active:
      usage.visualIds.size > 0 ||
      usage.referencedByMeasures.size > 0,
  });

  const measureUsage = [...measures.values()]
    .map(serializeObjectUsage)
    .sort(compareUsage);

  const columnUsage = [...columns.values()]
    .map(serializeObjectUsage)
    .sort(compareUsage);

  const tableUsage = [...tables.values()]
    .map((usage) => ({
      table: usage.table,
      visualReferences: usage.visualIds.size,
      pageReferences: usage.pageIds.size,
      directlyUsedMeasures: usage.measures.size,
      directlyUsedColumns: usage.columns.size,
    }))
    .sort((left, right) =>
      right.visualReferences - left.visualReferences ||
      right.pageReferences - left.pageReferences ||
      left.table.localeCompare(right.table),
    );

  return {
    measures: measureUsage,
    columns: columnUsage,
    tables: tableUsage,
    unusedMeasures: measureUsage.filter((item) => !item.active),
    unusedColumns: columnUsage.filter((item) => !item.active),
  };
}

function compareUsage(left, right) {
  return (
    right.visualReferences - left.visualReferences ||
    right.pageReferences - left.pageReferences ||
    right.referencedByMeasures - left.referencedByMeasures ||
    left.table.localeCompare(right.table) ||
    left.name.localeCompare(right.name)
  );
}
