// Generates every adapter from the declarative source of truth (schema/tables.json):
//   - schema/schema.sql                      idempotent Postgres DDL (+ RLS, indexes)
//   - supabase/schemas/benefactor.sql       Supabase declarative desired-state schema
//   - generated/json-schema/*.json           JSON Schema (row + insert) per table
//   - generated/dart/lib/benefactor_interfaces.dart
//   - generated/rust/src/lib.rs
//
// Usage:
//   node src/generate.mjs            write all artifacts
//   node src/generate.mjs --check    fail (exit 1) if any artifact is stale
//   node src/generate.mjs --print-sql
//
// MIGRATION SAFETY: artifacts are for review. Apply schema changes through the
// Supabase declarative workflow (supabase db diff) or reviewed migrations only.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const checkOnly = process.argv.includes('--check');
const printSql = process.argv.includes('--print-sql');

const contract = JSON.parse(readFileSync(join(root, 'schema/tables.json'), 'utf8'));
const schema = contract.schema || 'public';

const banner = (comment) =>
  [
    `${comment} Generated from schema/tables.json by @benefactor/interfaces. Do not edit by hand.`,
    `${comment} SOURCE OF TRUTH: schema/tables.json. Regenerate with: node src/generate.mjs`,
    `${comment} Contract version: ${contract.contractVersion}`,
    `${comment} MIGRATION SAFETY: review every change; apply via supabase db diff or reviewed migrations. Never auto-apply.`,
  ].join('\n');

// --- helpers ---------------------------------------------------------------
const camel = (s) =>
  s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
const pascal = (s) => {
  const c = camel(s);
  return c.charAt(0).toUpperCase() + c.slice(1);
};
const screaming = (s) => s.replace(/[a-z]/g, (c) => c.toUpperCase());
const dartClassName = (t) => t.names?.dart || pascal(t.name);
const rustStructName = (t) => t.names?.rust || pascal(t.name);

function sqlType(col) {
  if (col.sqlType) return col.sqlType;
  switch (col.kind) {
    case 'uuid': return 'uuid';
    case 'string': return 'text';
    case 'enum': return 'text';
    case 'int': return 'integer';
    case 'bigint': return 'bigint';
    case 'double': return 'double precision';
    case 'bool': return 'boolean';
    case 'timestamptz': return 'timestamptz';
    case 'jsonb': return 'jsonb';
    default: throw new Error(`unknown kind ${col.kind} for ${col.name}`);
  }
}

// --- SQL -------------------------------------------------------------------
function renderColumnDdl(col) {
  const parts = [`  ${col.name} ${sqlType(col)}`];
  if (col.notNull) parts.push('not null');
  if (col.defaultSql) parts.push(`default ${col.defaultSql}`);
  if (col.references) {
    const r = col.references;
    parts.push(`references ${r.table}(${r.column})`);
    if (r.onDelete) parts.push(`on delete ${r.onDelete}`);
  }
  return parts.join(' ');
}

function renderTableSql(table, { idempotent }) {
  const lines = [];
  const qualified = `${schema}.${table.name}`;
  lines.push(`-- ${table.description || table.name}`);
  const createKw = idempotent ? 'create table if not exists' : 'create table';
  const cols = table.columns.map(renderColumnDdl);
  const pk = table.columns.filter((c) => c.primaryKey).map((c) => c.name);
  if (pk.length) {
    cols.push(`  constraint ${table.name}_pkey primary key (${pk.join(', ')})`);
  }
  lines.push(`${createKw} ${qualified} (`);
  lines.push(cols.join(',\n'));
  lines.push(');');
  lines.push('');

  if (table.rls?.enable) {
    lines.push(`alter table ${qualified} enable row level security;`);
    if (table.rls.ownerColumn) {
      // Owner-scoped (Supabase Auth): the signed-in user only sees/writes rows
      // where auth.uid() matches the owner column.
      const owner = table.rls.ownerColumn;
      const policy = `${table.name}_owner`;
      const body =
        `for all to authenticated using (auth.uid() = ${owner}) with check (auth.uid() = ${owner})`;
      if (idempotent) {
        lines.push(
          `do $$ begin`,
          `  if not exists (select 1 from pg_policies where schemaname = '${schema}' and tablename = '${table.name}' and policyname = '${policy}') then`,
          `    create policy "${policy}" on ${qualified} ${body};`,
          `  end if;`,
          `end $$;`,
        );
      } else {
        lines.push(`create policy "${policy}" on ${qualified} ${body};`);
      }
    } else {
      // Service-role only: RLS is on with NO policies, so anon/authenticated
      // roles get no access. Writes use the service-role key (bypasses RLS).
      lines.push(`-- service-role only: no anon/authenticated policies (writes use the service-role key, which bypasses RLS).`);
    }
    lines.push('');
  }

  for (const idx of table.indexes || []) {
    const createIdx = idempotent ? 'create index if not exists' : 'create index';
    lines.push(`${createIdx} ${idx.name} on ${qualified} (${idx.columns.join(', ')});`);
  }
  if ((table.indexes || []).length) lines.push('');
  return lines.join('\n');
}

function renderSql({ idempotent }) {
  const out = [banner('--'), ''];
  out.push('create extension if not exists pgcrypto;', '');
  for (const table of contract.tables) {
    out.push(renderTableSql(table, { idempotent }));
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

// --- JSON Schema -----------------------------------------------------------
function jsonSchemaProp(col) {
  const base = {};
  switch (col.kind) {
    case 'uuid': base.type = 'string'; base.format = 'uuid'; break;
    case 'string': base.type = 'string'; break;
    case 'enum': base.type = 'string'; base.enum = col.enumValues; break;
    case 'int': case 'bigint': base.type = 'integer'; break;
    case 'double': base.type = 'number'; break;
    case 'bool': base.type = 'boolean'; break;
    case 'timestamptz': base.type = 'string'; base.format = 'date-time'; break;
    case 'jsonb': base.type = 'object'; break;
  }
  if (col.validation?.minimum !== undefined) base.minimum = col.validation.minimum;
  if (col.validation?.maximum !== undefined) base.maximum = col.validation.maximum;
  if (col.description) base.description = col.description;
  if (!col.notNull) return { anyOf: [base, { type: 'null' }] };
  return base;
}

function jsonSchemaFor(table, { insert }) {
  const cols = insert
    ? table.columns.filter((c) => !c.serverGenerated)
    : table.columns;
  const properties = {};
  const required = [];
  for (const col of cols) {
    properties[col.name] = jsonSchemaProp(col);
    if (col.notNull && !(insert && col.serverGenerated)) required.push(col.name);
  }
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `https://benefactor.cc/schema/${table.name}.${insert ? 'insert' : 'row'}.json`,
    title: `${dartClassName(table)}${insert ? 'Insert' : 'Row'}`,
    description: table.description,
    type: 'object',
    additionalProperties: false,
    properties,
    required,
  };
}

// --- Dart ------------------------------------------------------------------
function dartType(col) {
  switch (col.kind) {
    case 'uuid': case 'string': case 'enum': case 'timestamptz': return 'String';
    case 'int': case 'bigint': return 'int';
    case 'double': return 'double';
    case 'bool': return 'bool';
    case 'jsonb': return 'Map<String, Object?>';
    default: return 'Object?';
  }
}
function dartReader(col) {
  const key = JSON.stringify(col.name);
  const opt = !col.notNull;
  switch (col.kind) {
    case 'uuid': case 'string': case 'enum': case 'timestamptz':
      return opt ? `_optString(json, ${key})` : `_reqString(json, ${key})`;
    case 'int': case 'bigint':
      return opt ? `_optInt(json, ${key})` : `_reqInt(json, ${key})`;
    case 'double':
      return opt ? `_optDouble(json, ${key})` : `_reqDouble(json, ${key})`;
    case 'bool':
      return opt ? `_optBool(json, ${key})` : `_reqBool(json, ${key})`;
    case 'jsonb':
      return opt ? `_optObject(json, ${key})` : `_reqObject(json, ${key})`;
    default: return `json[${key}]`;
  }
}

function renderDart() {
  const out = [banner('//'), '', "import 'dart:convert';", ''];
  for (const table of contract.tables) {
    const cls = dartClassName(table);
    out.push(`const ${camel(table.name)}Table = ${JSON.stringify(table.name)};`);
    for (const col of table.columns.filter((c) => c.kind === 'enum')) {
      out.push(
        `const ${camel(table.name)}${pascal(col.name)}Values = <String>[${col.enumValues
          .map((v) => JSON.stringify(v))
          .join(', ')}];`,
      );
    }
    out.push('');
    out.push(`class ${cls} {`);
    // constructor
    out.push(`  const ${cls}({`);
    for (const col of table.columns) {
      const req = col.notNull ? 'required ' : '';
      out.push(`    ${req}this.${camel(col.name)},`);
    }
    out.push('  });', '');
    // fields
    for (const col of table.columns) {
      const t = dartType(col) + (col.notNull ? '' : '?');
      const doc = col.description ? `  /// ${col.description}\n` : '';
      out.push(`${doc}  final ${t} ${camel(col.name)};`);
    }
    out.push('');
    // fromJson
    out.push(`  factory ${cls}.fromJson(Map<String, Object?> json) {`);
    out.push(`    return ${cls}(`);
    for (const col of table.columns) {
      out.push(`      ${camel(col.name)}: ${dartReader(col)},`);
    }
    out.push('    );');
    out.push('  }', '');
    // toJson
    out.push('  Map<String, Object?> toJson() {');
    out.push('    return {');
    for (const col of table.columns) {
      out.push(`      ${JSON.stringify(col.name)}: ${camel(col.name)},`);
    }
    out.push('    };');
    out.push('  }', '');
    // toInsertJson (omit server-generated)
    out.push('  /// Row for INSERT: server-generated columns are omitted so the');
    out.push('  /// database fills them (id, user_id via auth.uid(), created_at).');
    out.push('  Map<String, Object?> toInsertJson() {');
    out.push('    return {');
    for (const col of table.columns.filter((c) => !c.serverGenerated)) {
      out.push(`      ${JSON.stringify(col.name)}: ${camel(col.name)},`);
    }
    out.push('    };');
    out.push('  }');
    out.push('}');
    out.push('');
  }
  out.push(_dartHelpers());
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

function _dartHelpers() {
  return `// --- readers ---------------------------------------------------------------
String _reqString(Map<String, Object?> j, String k) => j[k]! as String;
String? _optString(Map<String, Object?> j, String k) => j[k] as String?;
int _reqInt(Map<String, Object?> j, String k) => (j[k]! as num).toInt();
int? _optInt(Map<String, Object?> j, String k) => (j[k] as num?)?.toInt();
double _reqDouble(Map<String, Object?> j, String k) => (j[k]! as num).toDouble();
double? _optDouble(Map<String, Object?> j, String k) => (j[k] as num?)?.toDouble();
bool _reqBool(Map<String, Object?> j, String k) => j[k]! as bool;
bool? _optBool(Map<String, Object?> j, String k) => j[k] as bool?;
Map<String, Object?> _reqObject(Map<String, Object?> j, String k) {
  final v = j[k];
  if (v is Map<String, Object?>) return v;
  if (v is Map) return v.cast<String, Object?>();
  if (v is String && v.isNotEmpty) {
    return (jsonDecode(v) as Map).cast<String, Object?>();
  }
  return <String, Object?>{};
}
Map<String, Object?>? _optObject(Map<String, Object?> j, String k) =>
    j[k] == null ? null : _reqObject(j, k);
`;
}

// --- Rust ------------------------------------------------------------------
function rustType(col) {
  const inner = (() => {
    switch (col.kind) {
      case 'uuid': case 'string': case 'enum': case 'timestamptz': return 'String';
      case 'int': case 'bigint': return 'i64';
      case 'double': return 'f64';
      case 'bool': return 'bool';
      case 'jsonb': return 'serde_json::Value';
      default: return 'serde_json::Value';
    }
  })();
  return col.notNull ? inner : `Option<${inner}>`;
}

function renderRust() {
  const out = [banner('//'), '', 'use serde::{Deserialize, Serialize};', ''];
  for (const table of contract.tables) {
    const st = rustStructName(table);
    out.push(`pub const ${screaming(table.name)}_TABLE: &str = ${JSON.stringify(table.name)};`);
    out.push(
      `pub const ${screaming(table.name)}_COLUMNS: &[&str] = &[${table.columns
        .map((c) => JSON.stringify(c.name))
        .join(', ')}];`,
    );
    for (const col of table.columns.filter((c) => c.kind === 'enum')) {
      out.push(
        `pub const ${screaming(table.name)}_${screaming(col.name)}_VALUES: &[&str] = &[${col.enumValues
          .map((v) => JSON.stringify(v))
          .join(', ')}];`,
      );
    }
    out.push('');
    if (table.description) out.push(`/// ${table.description}`);
    out.push('#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]');
    out.push(`pub struct ${st} {`);
    for (const col of table.columns) {
      if (col.description) out.push(`    /// ${col.description}`);
      // field name == column (snake_case); skip serializing None on insert.
      if (!col.notNull) out.push('    #[serde(skip_serializing_if = "Option::is_none", default)]');
      out.push(`    pub ${col.name}: ${rustType(col)},`);
    }
    out.push('}');
    out.push('');
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

// --- write / check ---------------------------------------------------------
const artifacts = [];
const add = (path, content) => artifacts.push({ path, content });

add('schema/schema.sql', renderSql({ idempotent: true }));
add('supabase/schemas/benefactor.sql', renderSql({ idempotent: false }));
add('generated/dart/lib/benefactor_interfaces.dart', renderDart());
add('generated/dart/pubspec.yaml', dartPubspec());
add('generated/rust/src/lib.rs', renderRust());
add('generated/rust/Cargo.toml', rustCargo());

const schemaIndex = { $schema: 'https://json-schema.org/draft/2020-12/schema', tables: [] };
for (const table of contract.tables) {
  for (const insert of [false, true]) {
    const name = `generated/json-schema/${table.name}.${insert ? 'insert' : 'row'}.schema.json`;
    add(name, JSON.stringify(jsonSchemaFor(table, { insert }), null, 2) + '\n');
    schemaIndex.tables.push({ table: table.name, kind: insert ? 'insert' : 'row', path: relative(root, join(root, name)) });
  }
}
add('generated/json-schema/index.json', JSON.stringify(schemaIndex, null, 2) + '\n');

function dartPubspec() {
  return `# ${'Generated'} from schema/tables.json. Do not edit by hand.
name: benefactor_interfaces
description: Generated Dart adapters for the Benefactor Supabase schema.
publish_to: none
version: ${contract.contractVersion.replaceAll('.', '')}.0
environment:
  sdk: ^3.0.0
`;
}
function rustCargo() {
  return `# Generated from schema/tables.json. Do not edit by hand.
[package]
name = "benefactor-interfaces"
version = "0.1.0"
edition = "2021"
description = "Generated Rust adapters for the Benefactor Supabase schema."

[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
`;
}

if (printSql) {
  process.stdout.write(renderSql({ idempotent: true }));
  process.exit(0);
}

let stale = 0;
for (const { path, content } of artifacts) {
  const abs = join(root, path);
  const current = existsSync(abs) ? readFileSync(abs, 'utf8') : null;
  if (current === content) continue;
  stale += 1;
  if (checkOnly) {
    console.error(`stale: ${path}`);
  } else {
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
    console.log(`wrote: ${path}`);
  }
}

if (checkOnly && stale > 0) {
  console.error(`\n${stale} artifact(s) out of date. Run: node src/generate.mjs`);
  process.exit(1);
}
if (checkOnly) {
  console.log(`up to date (${artifacts.length} artifacts).`);
}
// Silence unused import in some node versions.
void readdirSync;
