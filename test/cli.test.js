import assert from 'node:assert/strict';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { runCli } from '../src/cli.js';
import { writePbipFixture } from './fixtures/pbip.js';

test('CLI generates standalone HTML, structured JSON and RAG JSONL', async () => {
  const root = mkdtempSync(join(tmpdir(), 'pbi-profiling-cli-'));
  const project = join(root, 'project');
  const output = join(root, 'output');

  try {
    writePbipFixture(project);

    const exitCode = await runCli([
      'profile',
      project,
      '--output',
      output,
    ]);

    assert.equal(exitCode, 0);

    const htmlPath = join(output, 'profile.html');
    const jsonPath = join(output, 'profile.json');
    const ragPath = join(output, 'profile.rag.jsonl');

    assert.equal(existsSync(htmlPath), true);
    assert.equal(existsSync(jsonPath), true);
    assert.equal(existsSync(ragPath), true);
    assert.ok(statSync(htmlPath).size > 10_000);
    assert.ok(statSync(ragPath).size > 100);

    const html = readFileSync(htmlPath, 'utf-8');
    const profile = JSON.parse(readFileSync(jsonPath, 'utf-8'));
    const ragChunks = readFileSync(ragPath, 'utf-8')
      .trim()
      .split('\n')
      .map(JSON.parse);

    assert.match(html, /PBI Profiling/);
    assert.match(html, /id="context"/);
    assert.match(html, /id="intelligence"/);
    assert.match(html, /id="lineage-payload"/);
    assert.match(html, /id="profile-payload"/);
    assert.equal(html.includes('<script src='), false);
    assert.equal(profile.schemaVersion, 2);
    assert.equal(profile.overview.counts.tables, 2);
    assert.equal(profile.overview.counts.visuals, 1);
    assert.equal(profile.context.status, 'not-provided');
    assert.ok(Array.isArray(profile.analytical.opportunities));
    assert.ok(ragChunks.some((chunk) => chunk.type === 'overview'));
    assert.ok(ragChunks.some((chunk) => chunk.type === 'measure'));
  } finally {
    rmSync(root, {
      recursive: true,
      force: true,
    });
  }
});

test('CLI auto-loads a valid business context sidecar without embedding its absolute path', async () => {
  const root = mkdtempSync(join(tmpdir(), 'pbi-profiling-context-'));
  const project = join(root, 'project');
  const output = join(root, 'output');

  try {
    writePbipFixture(project);
    writeFileSync(
      join(project, 'pbi-profiling.context.json'),
      JSON.stringify({
        schemaVersion: 1,
        dashboard: {
          purpose: 'Explain operational availability',
          audience: ['Operations'],
          operationalUse: ['Daily monitoring'],
          businessQuestions: ['Where is availability degrading?'],
          refresh: {
            cadence: 'Hourly',
            sla: '90 minutes',
          },
        },
      }),
      'utf-8',
    );

    const exitCode = await runCli([
      'profile',
      project,
      '--output',
      output,
    ]);

    assert.equal(exitCode, 0);

    const profileText = readFileSync(join(output, 'profile.json'), 'utf-8');
    const profile = JSON.parse(profileText);
    const html = readFileSync(join(output, 'profile.html'), 'utf-8');

    assert.equal(profile.context.status, 'provided');
    assert.equal(profile.context.source, 'pbi-profiling.context.json');
    assert.equal(
      profile.context.data.dashboard.purpose,
      'Explain operational availability',
    );
    assert.equal(profileText.includes(root), false);
    assert.match(html, /Explain operational availability/);
  } finally {
    rmSync(root, {
      recursive: true,
      force: true,
    });
  }
});
