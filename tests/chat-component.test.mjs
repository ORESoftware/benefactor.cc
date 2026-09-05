import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const layout = await readFile(join(here, '..', 'src', 'layouts', 'BaseLayout.astro'), 'utf8');

test('all BaseLayout pages expose the reviewed anonymous ORES Chat component', () => {
  assert.match(layout, /https:\/\/ores-chat\.github\.io\/components\/v1\/ores-chat-footer-link\.js/);
  assert.match(layout, /<ores-chat-footer-link/);
  assert.match(layout, /context-id="benefactor-marketing"/);
  assert.match(layout, /https:\/\/ores-chat\.github\.io\/chat\//);
  assert.match(layout, /mode=\{chatMode\}/);
});

test('chat API configuration is optional, HTTPS-only, and Benefactor-host allow-listed', () => {
  assert.match(layout, /PUBLIC_ORES_CHAT_API_BASE/);
  assert.match(layout, /chatOrigin\.protocol === 'https:'/);
  assert.match(layout, /api\.benefactor\.cc/);
  assert.match(layout, /admin-api\.benefactor\.cc/);
  assert.match(layout, /safe link-only mode/);
});

test('the CSP permits only the component distribution and configured chat API', () => {
  assert.match(layout, /script-src '[^']*' 'unsafe-inline' https:\/\/ores-chat\.github\.io/);
  assert.match(layout, /connect-src 'self'\$\{telemetryConnectSources\}\$\{chatConnectSources\}/);
  assert.doesNotMatch(layout, /PUBLIC_ORES_CHAT_API_BASE[^\n]*Authorization/);
});
