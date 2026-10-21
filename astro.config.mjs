// @ts-check
import { defineConfig } from 'astro/config';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const customDomain = process.env.CUSTOM_DOMAIN?.trim();
const release = {
  calver: process.env.PUBLIC_BENEFACTOR_CALVER?.trim() || 'dev',
  releaseDate: process.env.PUBLIC_BENEFACTOR_RELEASE_DATE?.trim() || 'dev',
  gitSha: process.env.PUBLIC_BENEFACTOR_GIT_SHA?.trim() || 'local',
};

const releaseFooterScript = `
(() => {
  const release = ${JSON.stringify(release)};

  const renderReleaseMetadata = () => {
    const footer = document.querySelector('#site-footer .footer__bottom');
    if (!footer || footer.querySelector('[data-benefactor-release]')) return;

    const metadata = document.createElement('p');
    metadata.className = 'footer__copy';
    metadata.dataset.benefactorRelease = release.calver;
    metadata.dataset.releaseDate = release.releaseDate;
    metadata.dataset.gitSha = release.gitSha;

    const version = document.createElement('span');
    version.textContent = 'version ' + release.calver;
    metadata.append(version);

    metadata.append(document.createTextNode(' · '));

    if (release.gitSha !== 'local') {
      const commit = document.createElement('a');
      commit.className = 'footer__link--inline';
      commit.href = 'https://github.com/ORESoftware/benefactor.cc/commit/' + release.gitSha;
      commit.target = '_blank';
      commit.rel = 'noopener noreferrer';
      commit.textContent = 'commit ' + release.gitSha.slice(0, 12);
      commit.title = release.gitSha;
      metadata.append(commit);
    } else {
      const commit = document.createElement('span');
      commit.textContent = 'commit local';
      metadata.append(commit);
    }

    if (release.releaseDate !== 'dev') {
      metadata.append(document.createTextNode(' · '));
      const released = document.createElement('time');
      released.dateTime = release.releaseDate;
      released.textContent = 'released ' + release.releaseDate;
      metadata.append(released);
    }

    footer.append(metadata);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderReleaseMetadata, { once: true });
  } else {
    renderReleaseMetadata();
  }
})();
`;

const releaseMetadataIntegration = {
  name: 'benefactor-release-metadata',
  hooks: {
    'astro:config:setup': ({ injectScript }) => {
      injectScript('head-inline', releaseFooterScript);
    },
  },
};


const sitemapIntegration = {
  name: 'benefactor-search-discovery',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      const root = fileURLToPath(dir);
      const domain = customDomain ? `https://${customDomain}` : 'https://oresoftware.github.io';
      const base = customDomain ? '/' : '/benefactor.cc/';
      const htmlFiles = [];
      const walk = async (directory) => {
        for (const entry of await readdir(directory, { withFileTypes: true })) {
          const path = join(directory, entry.name);
          if (entry.isDirectory()) await walk(path);
          else if (entry.isFile() && entry.name === 'index.html') htmlFiles.push(path);
        }
      };
      await walk(root);

      // Read the actual prerendered output, including all dynamic Astro slugs.
      const urls = [];
      for (const file of htmlFiles) {
        const path = relative(root, file).split(sep).join('/');
        const slug = path === 'index.html' ? '' : path.slice(0, -'index.html'.length);
        // Defense in depth: utility/private pages must never be indexed.
        if (slug.startsWith('internal/') || slug === 'unsubscribe/') continue;
        const html = await readFile(file, 'utf8');
        const robotMetas = html.match(/<meta[^>]*>/gi) ?? [];
        if (robotMetas.some((tag) => /name=["']robots["']/i.test(tag) &&
          /content=["'][^"']*noindex/i.test(tag))) continue;
        urls.push(new URL(`${base}${slug}`, domain).href);
      }
      urls.sort();
      const home = new URL(base, domain).href;
      const blogs = new URL(`${base}blogs/`, domain).href;
      if (!urls.includes(home) || !urls.includes(blogs) ||
          !urls.some((url) => url.startsWith(blogs) && url !== blogs)) {
        throw new Error('Incomplete sitemap: homepage, blogs index or posts missing');
      }

      // Deliberately omit lastmod: deployment timestamp is not content freshness.
      const escapeXml = (value) => value.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
      const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`),
        '</urlset>',
        '',
      ].join('\n');
      await writeFile(join(root, 'sitemap.xml'), xml);
      await writeFile(join(root, 'robots.txt'),
        `User-agent: *\nAllow: /\n\nSitemap: ${new URL(`${base}sitemap.xml`, domain).href}\n`);
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site: customDomain ? `https://${customDomain}` : 'https://oresoftware.github.io',
  base: customDomain ? '/' : '/benefactor.cc',
  trailingSlash: 'always',
  integrations: [releaseMetadataIntegration, sitemapIntegration],
  server: {
    port: 4323,
  },
});
