#!/usr/bin/env node
// Pre-submission sanity check.
// Runs lightweight steps so the developer knows the bundle is OK to ship:
//   1. Required files exist (README, LICENSE, railway.json, schema, seed)
//   2. Backend type-checks
//   3. Web type-checks
//   4. Backend tests pass
//   5. Web builds
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const required = [
  'README.md',
  'LICENSE',
  'railway.json',
  'nixpacks.toml',
  'backend/prisma/schema.prisma',
  'backend/prisma/seed.ts',
  'backend/src/index.ts',
  'web/src/main.tsx',
  'docs/API.md',
  'docs/DEPLOY.md',
  'docs/ARCHITECTURE.md',
  'docs/DEMO.md',
];

let failures = 0;

function step(label, fn) {
  process.stdout.write(`- ${label}... `);
  try {
    fn();
    process.stdout.write('ok\n');
  } catch (err) {
    failures += 1;
    process.stdout.write(`FAIL\n  ${(err && err.message) || err}\n`);
  }
}

function runNpm(script) {
  const result = spawnSync('npm', ['run', script], { cwd: root, stdio: 'pipe', encoding: 'utf8' });
  if (result.status !== 0) {
    const out = (result.stdout || '') + (result.stderr || '');
    throw new Error(out.split('\n').slice(-8).join('\n').trim());
  }
}

step('required files', () => {
  const missing = required.filter((rel) => !existsSync(path.join(root, rel)));
  if (missing.length) throw new Error(`missing: ${missing.join(', ')}`);
});

step('README mentions Live URL placeholder', () => {
  const readme = readFileSync(path.join(root, 'README.md'), 'utf8');
  if (!readme.includes('Live URL')) throw new Error('README missing the Live URL section');
});

step('backend typecheck', () => runNpm('typecheck:backend'));
step('web typecheck', () => runNpm('typecheck:web'));
step('backend tests', () => runNpm('test:backend'));
step('web build', () => runNpm('build:web'));

if (failures > 0) {
  console.error(`\n${failures} step(s) failed. Fix and re-run before submitting.`);
  process.exit(1);
}

console.log('\nAll checks passed. Ready to submit.');
