import assert from 'node:assert/strict';
import {
  mkdtempSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { analyzeProject } from '../src/engine/analyze.js';
import { buildProfile } from '../src/profile/build.js';
import { writePbipFixture } from './fixtures/pbip.js';

test('PBIP folder is parsed end-to-end into a profile', () => {
  const root = mkdtempSync(join(tmpdir(), 'pbi-profiling-'));

  try {
    writePbipFixture(root);

    const result = analyzeProject(root);
    const profile = buildProfile(result);

    assert.equal(profile.overview.counts.tables, 2);
    assert.equal(profile.overview.counts.measures, 2);
    assert.equal(profile.overview.counts.pages, 1);
    assert.equal(profile.overview.counts.visuals, 1);

    const totalSales = profile.usage.measures.find(
      (measure) => measure.name === 'Total Sales',
    );
    const unused = profile.usage.measures.find(
      (measure) => measure.name === 'Unused Metric',
    );

    assert.equal(totalSales.visualReferences, 1);
    assert.equal(totalSales.active, true);
    assert.equal(unused.active, false);
    assert.equal(profile.report.pages[0].name, 'Sales Overview');
    assert.equal(profile.report.visuals[0].position.width, 720);
  } finally {
    rmSync(root, {
      recursive: true,
      force: true,
    });
  }
});
