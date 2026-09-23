export interface ManagedTabDestination {
  label: string;
  url: string;
  prefixes: readonly string[];
}

export interface ManagedTabLaunchResult {
  opened: number;
  reused: number;
  blocked: number;
}

type OpenedTab = {
  prefixes: readonly string[];
  handle: Window;
};

const openedTabs: OpenedTab[] = [];

export const internalWorkspaceTabs: readonly ManagedTabDestination[] = [
  {
    label: 'Instagram',
    url: 'https://www.instagram.com/benefactor_cc/',
    prefixes: ['instagram.com/benefactor_cc', 'www.instagram.com/benefactor_cc'],
  },
  {
    label: 'Facebook',
    url: 'https://www.facebook.com/benefactor_cc',
    prefixes: ['facebook.com/benefactor_cc', 'www.facebook.com/benefactor_cc'],
  },
  {
    label: 'TikTok',
    url: 'https://www.tiktok.com/@benefactor_cc',
    prefixes: ['tiktok.com/@benefactor_cc', 'www.tiktok.com/@benefactor_cc'],
  },
  {
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/company/benefactor-marketing',
    prefixes: [
      'linkedin.com/company/benefactor-marketing',
      'www.linkedin.com/company/benefactor-marketing',
    ],
  },
  {
    label: 'Gmail',
    url: 'https://mail.google.com/',
    prefixes: ['gmail.com', 'www.gmail.com', 'mail.google.com'],
  },
  {
    label: 'HubSpot',
    url: 'https://app.hubspot.com/',
    prefixes: ['hubspot.com', 'www.hubspot.com', 'app.hubspot.com'],
  },
  {
    label: 'GitHub',
    url: 'https://github.com/benefactor-cc',
    prefixes: ['github.com/benefactor-cc', 'www.github.com/benefactor-cc'],
  },
  {
    label: 'ChatGPT',
    url: 'https://chatgpt.com/',
    prefixes: ['chatgpt.com', 'www.chatgpt.com'],
  },
] as const;

const normalizePrefix = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');

const prefixesOverlap = (left: readonly string[], right: readonly string[]): boolean =>
  left.some((leftPrefix) => {
    const normalizedLeft = normalizePrefix(leftPrefix);
    return right.some((rightPrefix) => {
      const normalizedRight = normalizePrefix(rightPrefix);
      return (
        normalizedLeft === normalizedRight ||
        normalizedLeft.startsWith(`${normalizedRight}/`) ||
        normalizedRight.startsWith(`${normalizedLeft}/`)
      );
    });
  });

const destinationWindowName = (destination: ManagedTabDestination): string => {
  const stablePrefix = normalizePrefix(destination.prefixes[0] ?? destination.url);
  return `benefactor_internal_${stablePrefix.replace(/[^a-z0-9]+/g, '_')}`;
};

const findOpenTab = (destination: ManagedTabDestination): Window | undefined => {
  for (let index = openedTabs.length - 1; index >= 0; index -= 1) {
    const tab = openedTabs[index];

    if (tab.handle.closed) {
      openedTabs.splice(index, 1);
      continue;
    }

    if (prefixesOverlap(tab.prefixes, destination.prefixes)) {
      return tab.handle;
    }
  }

  return undefined;
};

export const openInternalWorkspaceTabs = (
  destinations: readonly ManagedTabDestination[] = internalWorkspaceTabs,
): ManagedTabLaunchResult => {
  const result: ManagedTabLaunchResult = {
    opened: 0,
    reused: 0,
    blocked: 0,
  };

  for (const destination of destinations) {
    const existingTab = findOpenTab(destination);

    if (existingTab) {
      existingTab.focus();
      result.reused += 1;
      continue;
    }

    // A stable target name lets the browser reuse a tab previously opened by
    // this launcher even after this page is refreshed. Browsers intentionally
    // do not let one page enumerate arbitrary cross-origin tabs opened manually.
    const handle = window.open(destination.url, destinationWindowName(destination));

    if (!handle) {
      result.blocked += 1;
      continue;
    }

    openedTabs.push({ prefixes: destination.prefixes, handle });
    handle.focus();
    result.opened += 1;
  }

  return result;
};
