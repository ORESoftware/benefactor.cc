// Self-tests for the generator: no DB connection, no file writes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

test('tables.json is valid and declares the expected tables', () => {
  const contract = JSON.parse(read('schema/tables.json'));
  const names = contract.tables.map((t) => t.name);
  assert.deepEqual(names, ['benefactor_outreach_clicks']);
  for (const table of contract.tables) {
    assert.ok(table.columns.some((c) => c.primaryKey), `${table.name} needs a PK`);
    assert.ok(table.rls?.enable, `${table.name} should enable RLS`);
  }
});

test('generated artifacts are up to date (run: node src/generate.mjs)', () => {
  // --check exits non-zero when anything is stale.
  execFileSync('node', ['src/generate.mjs', '--check'], { cwd: root });
});

test('SQL enables RLS service-role-only (no anon/auth policy)', () => {
  const sql = read('schema/schema.sql');
  assert.match(sql, /alter table public\.benefactor_outreach_clicks enable row level security/);
  // Service-role-only: RLS on, but no auth.uid()/owner policy is created.
  assert.match(sql, /service-role only/);
  assert.doesNotMatch(sql, /create policy/);
});

test('Dart maps snake_case columns to camelCase fields', () => {
  const dart = read('generated/dart/lib/benefactor_interfaces.dart');
  assert.match(dart, /final String linkKey;/);
  assert.match(dart, /linkKey: _reqString\(json, "link_key"\)/);
  // INSERT shape omits server-generated columns (id, clicked_at).
  const afterInsert = dart.slice(dart.indexOf('toInsertJson'));
  const insertReturn = afterInsert.slice(
    afterInsert.indexOf('return {'),
    afterInsert.indexOf('};'),
  );
  assert.match(insertReturn, /"email": email/);
  assert.match(insertReturn, /"link_key": linkKey/);
  assert.doesNotMatch(insertReturn, /"clicked_at":/);
  assert.doesNotMatch(insertReturn, /"id": id/);
});

test('Rust struct uses serde + exports enum + column constants', () => {
  const rust = read('generated/rust/src/lib.rs');
  assert.match(rust, /pub struct OutreachClick/);
  assert.match(rust, /pub email: String,/);
  assert.match(rust, /pub source: Option<String>,/);
  assert.match(rust, /BENEFACTOR_OUTREACH_CLICKS_SOURCE_VALUES/);
});

test('insert JSON Schema drops server-generated columns', () => {
  const insert = JSON.parse(read('generated/json-schema/benefactor_outreach_clicks.insert.schema.json'));
  assert.ok(!('id' in insert.properties));
  assert.ok(!('clicked_at' in insert.properties));
  assert.ok('email' in insert.properties);
  assert.ok('link_key' in insert.properties);
  const row = JSON.parse(read('generated/json-schema/benefactor_outreach_clicks.row.schema.json'));
  assert.ok('id' in row.properties);
});
