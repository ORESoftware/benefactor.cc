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
  assert.deepEqual(names, ['acoustic_events', 'user_consents']);
  for (const table of contract.tables) {
    assert.ok(table.columns.some((c) => c.primaryKey), `${table.name} needs a PK`);
    assert.ok(table.rls?.enable, `${table.name} should enable RLS`);
  }
});

test('generated artifacts are up to date (run: node src/generate.mjs)', () => {
  // --check exits non-zero when anything is stale.
  execFileSync('node', ['src/generate.mjs', '--check'], { cwd: root });
});

test('SQL enables RLS + an owner policy for every table', () => {
  const sql = read('schema/schema.sql');
  for (const table of ['acoustic_events', 'user_consents']) {
    assert.match(sql, new RegExp(`alter table public.${table} enable row level security`));
    assert.match(sql, new RegExp(`create policy "${table}_owner"`));
  }
});

test('Dart maps snake_case columns to camelCase fields', () => {
  const dart = read('generated/dart/lib/sonus_auris_interfaces.dart');
  assert.match(dart, /final String deviceId;/);
  assert.match(dart, /deviceId: _reqString\(json, "device_id"\)/);
  // INSERT shape (first table's toInsertJson) omits server-generated columns.
  const afterInsert = dart.slice(dart.indexOf('toInsertJson'));
  const insertReturn = afterInsert.slice(
    afterInsert.indexOf('return {'),
    afterInsert.indexOf('};'),
  );
  assert.match(insertReturn, /"device_id": deviceId/);
  assert.doesNotMatch(insertReturn, /"created_at":/);
  assert.doesNotMatch(insertReturn, /"id": id/);
});

test('Rust struct uses serde + serde_json::Value for jsonb', () => {
  const rust = read('generated/rust/src/lib.rs');
  assert.match(rust, /pub struct AcousticEvent/);
  assert.match(rust, /pub details: serde_json::Value,/);
  assert.match(rust, /ACOUSTIC_EVENTS_KIND_VALUES/);
});

test('insert JSON Schema drops server-generated columns', () => {
  const insert = JSON.parse(read('generated/json-schema/acoustic_events.insert.schema.json'));
  assert.ok(!('id' in insert.properties));
  assert.ok(!('user_id' in insert.properties));
  assert.ok('device_id' in insert.properties);
  const row = JSON.parse(read('generated/json-schema/acoustic_events.row.schema.json'));
  assert.ok('id' in row.properties);
});
