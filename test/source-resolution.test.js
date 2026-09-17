import assert from 'node:assert/strict';
import test from 'node:test';

import { buildHealthProfile } from '../src/profile/health.js';
import { buildSourceResolutionProfile } from '../src/profile/source-resolution.js';

function webViewerModel() {
  return {
    stats: {
      confidence: {
        coverage: 0,
      },
    },
    tables: [
      {
        name: 'FactWeb',
        physical: {
          system: 'Web',
          url: 'https://example.invalid/data.parquet',
          table: null,
        },
      },
      {
        name: 'Lookup',
        physical: {
          system: 'Inline Literal',
          table: null,
        },
      },
    ],
    columns: [
      {
        table: 'FactWeb',
        name: 'Timestamp',
        origin: 'unresolved',
        confidence: 'unknown',
        sourceless: 'unresolved',
        reason: 'No physical table could be resolved from the Power Query expression.',
      },
      {
        table: 'FactWeb',
        name: 'Value',
        origin: 'unresolved',
        confidence: 'unknown',
        sourceless: 'unresolved',
        reason: 'No physical table could be resolved from the Power Query expression.',
      },
      {
        table: 'FactWeb',
        name: 'Supplier',
        origin: 'unresolved',
        confidence: 'unknown',
        sourceless: 'unresolved',
        reason: 'Joined in as "Supplier" from Lookup, whose physical table could not be resolved.',
      },
      {
        table: 'FactWeb',
        name: 'Derived',
        origin: 'computed-pq',
        confidence: 'exact',
        sourceless: 'computed-in-m',
        reason: 'Added in Power Query via Table.AddColumn; it has no physical source column.',
      },
      {
        table: 'Lookup',
        name: 'Supplier',
        origin: 'unresolved',
        confidence: 'unknown',
        sourceless: 'unresolved',
        reason: 'No physical table could be resolved from the Power Query expression.',
      },
    ],
    visuals: [],
  };
}

const usage = {
  unusedMeasures: [],
};

test('source resolution separates external resource, inline lineage and computed columns', () => {
  const resolution = buildSourceResolutionProfile(webViewerModel());

  assert.equal(resolution.summary.totalColumns, 5);
  assert.equal(resolution.summary.traceableColumns, 2);
  assert.equal(resolution.summary.physicalColumnResolved, 0);
  assert.equal(resolution.summary.resourceResolved, 2);
  assert.equal(resolution.summary.inlineColumns, 2);
  assert.equal(resolution.summary.unresolvedColumns, 0);
  assert.equal(resolution.summary.computedColumns, 1);
  assert.equal(resolution.summary.physicalColumnCoverage, 0);
  assert.equal(resolution.summary.resourceLineageCoverage, 1);

  const timestamp = resolution.columns.find(
    (item) => item.table === 'FactWeb' && item.column === 'Timestamp',
  );
  const supplier = resolution.columns.find(
    (item) => item.table === 'FactWeb' && item.column === 'Supplier',
  );
  const lookupSupplier = resolution.columns.find(
    (item) => item.table === 'Lookup' && item.column === 'Supplier',
  );

  assert.equal(timestamp.level, 'resource');
  assert.equal(timestamp.system, 'Web');
  assert.equal(supplier.level, 'inline');
  assert.equal(supplier.system, 'Inline Literal');
  assert.equal(supplier.resolvedViaTable, 'Lookup');
  assert.equal(lookupSupplier.level, 'inline');
  assert.equal(lookupSupplier.resolvedViaTable, 'Lookup');
});

test('health treats resource and inline lineage as information and keeps only true gaps as warnings', () => {
  const viewerModel = webViewerModel();
  const sourceResolution = buildSourceResolutionProfile(viewerModel);
  const health = buildHealthProfile(viewerModel, usage, { sourceResolution });

  const resourceFinding = health.findings.find(
    (item) => item.code === 'resource-level-source-columns',
  );
  const inlineFinding = health.findings.find(
    (item) => item.code === 'inline-source-columns',
  );
  const unresolvedFinding = health.findings.find(
    (item) => item.code === 'unresolved-source-columns',
  );

  assert.equal(resourceFinding.severity, 'info');
  assert.equal(resourceFinding.count, 2);
  assert.equal(inlineFinding.severity, 'info');
  assert.equal(inlineFinding.count, 2);
  assert.equal(
    inlineFinding.evidence.find((item) => item.table === 'FactWeb').sourceTable,
    'Lookup',
  );
  assert.equal(unresolvedFinding, undefined);
  assert.equal(health.sourceResolutionCoverage, 0);
  assert.equal(health.resourceLineageCoverage, 1);
  assert.equal(health.counts.warnings, 0);
  assert.equal(health.counts.info, 2);
});
