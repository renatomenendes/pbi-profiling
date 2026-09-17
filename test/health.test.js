import assert from 'node:assert/strict';
import test from 'node:test';

import { buildHealthProfile } from '../src/profile/health.js';

const viewerModel = {
  stats: {
    confidence: {
      coverage: 0.75,
    },
  },
  columns: [
    {
      table: 'Fact',
      name: 'Resolved',
      confidence: 'exact',
      sourceless: null,
    },
    {
      table: 'Fact',
      name: 'Unknown',
      confidence: 'unknown',
      sourceless: 'unresolved',
      reason: 'No source mapping',
    },
  ],
  visuals: [
    {
      id: 'visual-hidden',
      page: 'page-a',
      type: 'card',
      title: 'Hidden Card',
      neverShown: true,
      fields: [],
    },
    {
      id: 'visual-unresolved',
      page: 'page-a',
      type: 'tableEx',
      neverShown: false,
      fields: [
        {
          kind: 'measure',
          table: 'Measures',
          name: 'Missing',
          via: 'query',
          ref: null,
        },
      ],
    },
  ],
};

const usage = {
  unusedMeasures: [
    {
      table: 'Measures',
      name: 'Legacy',
    },
  ],
};

test('health findings remain evidence-backed and countable', () => {
  const profile = buildHealthProfile(
    viewerModel,
    usage,
    {
      pageMetadata: [
        {
          id: 'page-b',
          name: 'Tooltip',
          visibility: 'HiddenInViewMode',
          isHidden: true,
          parseError: null,
        },
      ],
      brokenReferences: [
        {
          source: 'Measures[Broken]',
          target: 'Measures[Gone]',
        },
      ],
    },
  );

  const codes = new Set(profile.findings.map((item) => item.code));

  assert.equal(profile.sourceResolutionCoverage, 0.75);
  assert.equal(codes.has('unresolved-source-columns'), true);
  assert.equal(codes.has('hidden-pages'), true);
  assert.equal(codes.has('never-shown-visuals'), true);
  assert.equal(codes.has('unused-measures'), true);
  assert.equal(codes.has('unresolved-visual-bindings'), true);
  assert.equal(codes.has('broken-model-references'), true);
  assert.equal(profile.counts.warnings, 4);
  assert.equal(profile.counts.info, 2);
  assert.equal(profile.counts.errors, 0);
});
