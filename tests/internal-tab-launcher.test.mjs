import assert from 'node:assert/strict';
import test from 'node:test';

const storage = new Map();
const opened = [];
let popupBudget = 0;

globalThis.window = {
  localStorage: {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    },
    removeItem(key) {
      storage.delete(key);
    },
  },
  open(url, name) {
    if (popupBudget <= 0) return null;
    popupBudget -= 1;

    const handle = {
      closed: false,
      focus() {},
    };

    opened.push({ url, name, handle });
    return handle;
  },
};

const launcher = await import('../src/scripts/internal-tab-launcher.ts');

test('repeated clicks advance when the browser permits only one popup per gesture', () => {
  launcher.forgetInternalWorkspaceTabs();
  opened.splice(0, opened.length);

  const destinations = launcher.internalWorkspaceTabs.slice(0, 3);

  popupBudget = 1;
  const first = launcher.openInternalWorkspaceTabs(destinations);
  assert.deepEqual(first, {
    opened: 1,
    openedIds: ['instagram'],
    reused: 0,
    remembered: 0,
    blocked: 1,
    remaining: 2,
    popupMode: 'single',
    nextDestinationId: 'facebook',
  });
  assert.equal(opened[0].url, destinations[0].url);

  popupBudget = 1;
  const second = launcher.openInternalWorkspaceTabs(destinations);
  assert.deepEqual(second, {
    opened: 1,
    openedIds: ['facebook'],
    reused: 1,
    remembered: 0,
    blocked: 0,
    remaining: 1,
    popupMode: 'single',
    nextDestinationId: 'tiktok',
  });
  assert.equal(opened[1].url, destinations[1].url);

  popupBudget = 1;
  const third = launcher.openInternalWorkspaceTabs(destinations);
  assert.deepEqual(third, {
    opened: 1,
    openedIds: ['tiktok'],
    reused: 2,
    remembered: 0,
    blocked: 0,
    remaining: 0,
    popupMode: 'single',
    nextDestinationId: null,
  });
  assert.equal(opened[2].url, destinations[2].url);
});

test('a closed managed tab is forgotten and becomes eligible to reopen', () => {
  launcher.forgetInternalWorkspaceTabs();
  opened.splice(0, opened.length);

  const [destination] = launcher.internalWorkspaceTabs;

  popupBudget = 1;
  const first = launcher.openInternalWorkspaceTabs([destination]);
  assert.equal(first.opened, 1);
  assert.equal(first.remaining, 0);

  opened[0].handle.closed = true;

  popupBudget = 1;
  const reopened = launcher.openInternalWorkspaceTabs([destination]);
  assert.equal(reopened.opened, 1);
  assert.equal(reopened.remaining, 0);
  assert.equal(opened.length, 2);
});
