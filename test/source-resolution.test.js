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
    ],
    visuals: [],
  };
}

const usage = {
  unusedMeasures: [],
};

test('resource-aware source resolution separates resource lineage from physical-column lineage', () => {
  const resolution = buildSourceResolutionProfile(webViewerModel());

  assert.equal(resolution.summary.traceableColumns, 3);
  assert.equal(resolution.summary.physicalColumnResolved, 0);
  assert.equal(resolution.summary.resourceResolved, 2);
  assert.equal(resolution.summary.unresolvedColumns, 1);
  assert.equal(resolution.summary.computedColumns, 1);
  assert.equal(resolution.summary.physicalColumnCoverage, 0);
  assert.equal(resolution.summary.resourceLineageCoverage, 2 / 3);

  const timestamp = resolution.columns.find((item) => item.column === 'Timestamp');
  const supplier = resolution.columns.find((item) => item.column === 'Supplier');

  assert.equal(timestamp.level, 'resource');
  assert.equal(timestamp.system, 'Web');
  assert.equal(supplier.level, 'unresolved');
});

test('health treats resource-only columns as information and keeps true gaps as warnings', () => {
  const viewerModel = webViewerModel();
  const sourceResolution = buildSourceResolutionProfile(viewerModel);
  const health = buildHealthProfile(viewerModel, usage, { sourceResolution });

  const resourceFinding = health.findings.find(
    (item) => item.code === 'resource-level-source-columns',
  );
  const unresolvedFinding = health.findings.find(
    (item) => item.code === 'unresolved-source-columns',
  );

  assert.equal(resourceFinding.severity, 'info');
  assert.equal(resourceFinding.count, 2);
  assert.equal(unresolvedFinding.severity, 'warning');
  assert.equal(unresolvedFinding.count, 1);
  assert.equal(health.sourceResolutionCoverage, 0);
  assert.equal(health.resourceLineageCoverage, 2 / 3);
});
