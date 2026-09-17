import assert from 'node:assert/strict';
import test from 'node:test';

import { extractPageMetadata } from '../src/profile/pages.js';

test('page metadata preserves visibility and page binding', () => {
  const reportFiles = new Map([
    [
      'Sample.Report/definition/pages/page-a/page.json',
      JSON.stringify({
        displayName: 'Overview',
        visibility: 'Visible',
        ordinal: 0,
        width: 1280,
        height: 720,
      }),
    ],
    [
      'Sample.Report/definition/pages/page-b/page.json',
      JSON.stringify({
        displayName: 'Tooltip',
        visibility: 'HiddenInViewMode',
        ordinal: 1,
        pageBinding: { type: 'Tooltip' },
      }),
    ],
  ]);

  const pages = extractPageMetadata(reportFiles);

  assert.equal(pages.length, 2);
  assert.equal(pages[0].id, 'page-a');
  assert.equal(pages[0].isHidden, false);
  assert.equal(pages[1].id, 'page-b');
  assert.equal(pages[1].name, 'Tooltip');
  assert.equal(pages[1].isHidden, true);
  assert.equal(pages[1].pageType, 'Tooltip');
});

test('page metadata exposes malformed JSON instead of hiding it', () => {
  const reportFiles = new Map([
    [
      'definition/pages/broken/page.json',
      '{not valid json',
    ],
  ]);

  const [page] = extractPageMetadata(reportFiles);

  assert.equal(page.id, 'broken');
  assert.equal(page.isHidden, null);
  assert.ok(page.parseError);
});
