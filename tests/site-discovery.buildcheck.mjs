import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { test } from 'node:test';

const root = join(process.cwd(), 'dist');
const site = 'https://benefactor.cc/';

async function htmlFiles(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await htmlFiles(path, out);
    else if (entry.isFile() && entry.name === 'index.html') out.push(path);
  }
  return out;
}

test('sitemap is exact parity with every indexable prerendered canonical URL', async () => {
  const xml = await readFile(join(root, 'sitemap.xml'), 'utf8');
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n/);
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.ok(Buffer.byteLength(xml) <= 50 * 1024 * 1024);
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  assert.ok(urls.length > 0 && urls.length <= 50000);
  assert.equal(urls.length, new Set(urls).size, 'duplicate URLs');
  const expected = [];
  for (const file of await htmlFiles(root)) {
    const fileName = relative(root, file).split(sep).join('/');
    const route = fileName === 'index.html' ? '' : fileName.slice(0, -'index.html'.length);
    const html = await readFile(file, 'utf8');
    const noindex = (html.match(/<meta[^>]*>/gi) ?? []).some((tag) =>
      /name=["']robots["']/i.test(tag) && /content=["'][^"']*noindex/i.test(tag));
    if (route.startsWith('internal/') || route === 'unsubscribe/') {
      assert.ok(noindex, 'utility page lacks noindex: ' + route);
      continue;
    }
    if (noindex) continue;
    const canonical = new URL(route, site).href;
    assert.ok(html.includes('rel="canonical"') && html.includes('href="' + canonical + '"'),
      'missing or incorrect canonical link on ' + route);
    expected.push(canonical);
  }
  assert.ok(expected.includes(site) && expected.includes(site + 'blogs/'));
  assert.ok(expected.some((url) => url.startsWith(site + 'blogs/') && url !== site + 'blogs/'));
  assert.deepEqual(urls, expected.sort(), 'sitemap differs from built public pages');
  for (const url of urls) {
    assert.ok(url.startsWith(site) && url.endsWith('/') && !url.includes('#') && !url.includes('?'));
  }
});

test('robots.txt points Google to production sitemap', async () => {
  const robots = await readFile(join(root, 'robots.txt'), 'utf8');
  assert.match(robots, /^User-agent: \*\nAllow: \/\n/m);
  assert.match(robots, /^Sitemap: https:\/\/benefactor\.cc\/sitemap\.xml$/m);
  assert.equal((await readFile(join(root, 'CNAME'), 'utf8')).trim(), 'benefactor.cc');
  await readFile(join(root, '.nojekyll'));
});
