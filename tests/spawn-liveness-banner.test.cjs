// allow-test-rule: source-text-is-the-product
// Workflow .md files ARE the deployed runtime contract — their text is exactly
// what an orchestrator loads and acts on at runtime. Asserting on that text
// tests shipped behavior, which is the recognized `source-text-is-the-product`
// exemption in CONTRIBUTING.md (Prohibited: Source-Grep Tests → Exception table).
// Same basis as tests/workflow-size-budget.test.cjs.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WORKFLOWS_DIR = path.join(__dirname, '..', 'get-shit-done', 'workflows');
const UI_BRAND = path.join(
  __dirname,
  '..',
  'get-shit-done',
  'references',
  'ui-brand.md',
);

// The single shared liveness convention, defined in references/ui-brand.md under
// "## Spawning Indicators". A subagent runs silently — nothing streams to the
// user until it returns — so every orchestrator that spawns one must say so, or
// a working subagent reads as a frozen session and gets killed mid-run.
const CANONICAL_PHRASE = 'runs in a subagent';

// A workflow "spawns" when it instructs an Agent() subagent call. The stable
// signal across every workflow and runtime is the `subagent_type` argument.
const SPAWN_SIGNAL = 'subagent_type';

function listMarkdown(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listMarkdown(full));
    else if (entry.isFile() && entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

describe('spawn liveness banner convention', () => {
  it('defines the canonical liveness phrase in references/ui-brand.md', () => {
    const content = fs.readFileSync(UI_BRAND, 'utf8');
    assert.ok(
      content.includes(CANONICAL_PHRASE),
      `references/ui-brand.md must define the spawn liveness convention — ` +
        `expected the canonical phrase "${CANONICAL_PHRASE}" under ` +
        `"## Spawning Indicators".`,
    );
  });

  it('every spawning workflow warns the user the spawn runs silently', () => {
    const offenders = [];
    for (const file of listMarkdown(WORKFLOWS_DIR)) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes(SPAWN_SIGNAL) && !content.includes(CANONICAL_PHRASE)) {
        offenders.push(path.relative(WORKFLOWS_DIR, file));
      }
    }
    assert.deepStrictEqual(
      offenders,
      [],
      `These workflows spawn a subagent but never tell the user it runs ` +
        `silently, so a working subagent looks like a frozen session. Add the ` +
        `liveness phrase "${CANONICAL_PHRASE}" to the line that announces each ` +
        `spawn (pattern: references/ui-brand.md → "## Spawning Indicators"):\n  ` +
        offenders.join('\n  '),
    );
  });

  // Negative proof — the check is not vacuous. A spawn announcement that omits
  // the phrase is detectable, so a future workflow that forgets it is caught.
  it('would flag a spawning workflow that omits the liveness phrase', () => {
    const bad = ['Agent(', '  subagent_type: "gsd-executor",', ')'].join('\n');
    assert.ok(bad.includes(SPAWN_SIGNAL), 'fixture must read as a spawn');
    assert.ok(
      !bad.includes(CANONICAL_PHRASE),
      'fixture omits the phrase, so the coverage check above would flag it',
    );
  });

  it('accepts a spawn announcement that carries the liveness phrase', () => {
    const good = [
      '◆ Spawning executor... (runs in a subagent — no output until it returns)',
      'Agent(',
      '  subagent_type: "gsd-executor",',
      ')',
    ].join('\n');
    assert.ok(
      good.includes(SPAWN_SIGNAL) && good.includes(CANONICAL_PHRASE),
      'a spawn announcement carrying the phrase must pass',
    );
  });
});
