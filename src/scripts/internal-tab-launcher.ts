export interface ManagedTabDestination {
  id: string;
  label: string;
  url: string;
  prefixes: readonly string[];
}

export interface ManagedTabLaunchResult {
  opened: number;
  reused: number;
  remembered: number;
  blocked: number;
  remaining: number;
}

type OpenedTab = {
  id: string;
  prefixes: readonly string[];
  handle: Window;
};

type RememberedTabs = Record<string, number>;

const openedTabs: OpenedTab[] = [];
const storageKey = 'benefactor.internal.workspace.opened.v1';
const rememberedTabTtlMs = 12 * 60 * 60 * 1000;

export const internalWorkspaceTabs: readonly ManagedTabDestination[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    url: 'https://www.instagram.com/benefactor_cc/',
    prefixes: ['instagram.com/benefactor_cc', 'www.instagram.com/benefactor_cc'],
  },
  {
    id: 'facebook',
    label: 'Facebook',
    url: 'https://www.facebook.com/benefactor_cc',
    prefixes: ['facebook.com/benefactor_cc', 'www.facebook.com/benefactor_cc'],
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    url: 'https://www.tiktok.com/@benefactor_cc',
    prefixes: ['tiktok.com/@benefactor_cc', 'www.tiktok.com/@benefactor_cc'],
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/company/benefactor-marketing',
    prefixes: [
      'linkedin.com/company/benefactor-marketing',
      'www.linkedin.com/company/benefactor-marketing',
    ],
  },
  {
    id: 'gmail',
    label: 'Gmail',
    url: 'https://mail.google.com/',
    prefixes: ['gmail.com', 'www.gmail.com', 'mail.google.com'],
  },
  {
    id: 'hubspot',
    label: 'HubSpot',
    url: 'https://app.hubspot.com/',
    prefixes: ['hubspot.com', 'www.hubspot.com', 'app.hubspot.com'],
  },
  {
    id: 'github',
    label: 'GitHub',
    url: 'https://github.com/benefactor-cc',
    prefixes: ['github.com/benefactor-cc', 'www.github.com/benefactor-cc'],
  },
  {
    id: 'chatgpt',
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

const readRememberedTabs = (): RememberedTabs => {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, number] =>
        typeof entry[1] === 'number' && Number.isFinite(entry[1]),
      ),
    );
  } catch {
    return {};
  }
};

const writeRememberedTabs = (tabs: RememberedTabs): void => {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(tabs));
  } catch {
    // The launcher still works with in-memory handles when storage is disabled.
  }
};

const pruneRememberedTabs = (now = Date.now()): RememberedTabs => {
  const tabs = readRememberedTabs();
  let changed = false;

  for (const [id, openedAt] of Object.entries(tabs)) {
    if (now - openedAt > rememberedTabTtlMs) {
      delete tabs[id];
      changed = true;
    }
  }

  if (changed) writeRememberedTabs(tabs);
  return tabs;
};

const forgetDestination = (id: string): void => {
  const rememberedTabs = readRememberedTabs();
  if (!(id in rememberedTabs)) return;

  delete rememberedTabs[id];
  writeRememberedTabs(rememberedTabs);
};

export const rememberInternalWorkspaceTab = (id: string): void => {
  const rememberedTabs = pruneRememberedTabs();
  rememberedTabs[id] = Date.now();
  writeRememberedTabs(rememberedTabs);
};

export const forgetInternalWorkspaceTabs = (): void => {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // Ignore storage failures; in-memory handles are still reset below.
  }

  openedTabs.splice(0, openedTabs.length);
};

const findOpenTab = (destination: ManagedTabDestination): Window | undefined => {
  for (let index = openedTabs.length - 1; index >= 0; index -= 1) {
    const tab = openedTabs[index];

    if (tab.handle.closed) {
      forgetDestination(tab.id);
      openedTabs.splice(index, 1);
      continue;
    }

    if (prefixesOverlap(tab.prefixes, destination.prefixes)) {
      return tab.handle;
    }
  }

  return undefined;
};

const isRemembered = (
  destination: ManagedTabDestination,
  rememberedTabs: RememberedTabs,
): boolean => destination.id in rememberedTabs;

const countRemaining = (
  destinations: readonly ManagedTabDestination[],
  rememberedTabs: RememberedTabs,
): number =>
  destinations.filter((destination) => {
    if (findOpenTab(destination)) return false;
    return !isRemembered(destination, rememberedTabs);
  }).length;

export const openInternalWorkspaceTabs = (
  destinations: readonly ManagedTabDestination[] = internalWorkspaceTabs,
): ManagedTabLaunchResult => {
  const result: ManagedTabLaunchResult = {
    opened: 0,
    reused: 0,
    remembered: 0,
    blocked: 0,
    remaining: 0,
  };

  const rememberedTabs = pruneRememberedTabs();

  for (const destination of destinations) {
    const existingTab = findOpenTab(destination);

    if (existingTab) {
      // Do not focus already-open tabs while bulk-launching. Some browsers consume
      // the user activation when focus changes, which can make the next popup fail.
      result.reused += 1;
      continue;
    }

    if (isRemembered(destination, rememberedTabs)) {
      result.remembered += 1;
      continue;
    }

    // Stable names let the browser reuse tabs opened by this launcher. If the
    // browser permits only one popup per user gesture, remember that success and
    // stop after the first blocked popup. The next click then advances to the next
    // missing destination instead of wasting the gesture on an already-open tab.
    const handle = window.open(destination.url, destinationWindowName(destination));

    if (!handle) {
      result.blocked += 1;
      break;
    }

    openedTabs.push({
      id: destination.id,
      prefixes: destination.prefixes,
      handle,
    });
    rememberedTabs[destination.id] = Date.now();
    writeRememberedTabs(rememberedTabs);
    result.opened += 1;
  }

  result.remaining = countRemaining(destinations, pruneRememberedTabs());
  return result;
};
