// @ts-check
import { defineConfig } from 'astro/config';

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

// https://astro.build/config
export default defineConfig({
  site: customDomain ? `https://${customDomain}` : 'https://oresoftware.github.io',
  base: customDomain ? '/' : '/benefactor.cc',
  trailingSlash: 'always',
  integrations: [releaseMetadataIntegration],
  server: {
    port: 4323,
  },
});
