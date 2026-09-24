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

test('bulk launch opens all destinations when the browser permits multiple popups', () => {
  launcher.forgetInternalWorkspaceTabs();
  opened.splice(0, opened.length);

  const destinations = launcher.internalWorkspaceTabs;
  popupBudget = destinations.length;

  const result = launcher.openInternalWorkspaceTabs(destinations, 'all');

  assert.equal(result.opened, 8);
  assert.equal(result.blocked, 0);
  assert.equal(result.remaining, 0);
  assert.equal(result.launchMode, 'all');
  assert.equal(result.nextDestinationId, null);
  assert.deepEqual(result.openedIds, destinations.map((destination) => destination.id));
});

test('bulk launch remains retryable after a browser allows only one popup', () => {
  launcher.forgetInternalWorkspaceTabs();
  opened.splice(0, opened.length);

  const destinations = launcher.internalWorkspaceTabs.slice(0, 3);

  popupBudget = 1;
  const first = launcher.openInternalWorkspaceTabs(destinations, 'all');
  assert.deepEqual(first, {
    opened: 1,
    openedIds: ['instagram'],
    reused: 0,
    remembered: 0,
    blocked: 1,
    remaining: 2,
    launchMode: 'all',
    nextDestinationId: 'facebook',
  });

  popupBudget = 2;
  const second = launcher.openInternalWorkspaceTabs(destinations, 'all');
  assert.deepEqual(second, {
    opened: 2,
    openedIds: ['facebook', 'tiktok'],
    reused: 1,
    remembered: 0,
    blocked: 0,
    remaining: 0,
    launchMode: 'all',
    nextDestinationId: null,
  });
});

test('explicit next mode opens only the next missing destination', () => {
  launcher.forgetInternalWorkspaceTabs();
  opened.splice(0, opened.length);

  const destinations = launcher.internalWorkspaceTabs.slice(0, 3);
  popupBudget = 3;

  const first = launcher.openInternalWorkspaceTabs(destinations, 'next');
  assert.deepEqual(first, {
    opened: 1,
    openedIds: ['instagram'],
    reused: 0,
    remembered: 0,
    blocked: 0,
    remaining: 2,
    launchMode: 'next',
    nextDestinationId: 'facebook',
  });
  assert.equal(opened.length, 1);

  const second = launcher.openInternalWorkspaceTabs(destinations, 'next');
  assert.equal(second.opened, 1);
  assert.deepEqual(second.openedIds, ['facebook']);
  assert.equal(second.remaining, 1);
  assert.equal(second.nextDestinationId, 'tiktok');
  assert.equal(opened.length, 2);
});

test('a closed managed tab is forgotten and becomes eligible to reopen', () => {
  launcher.forgetInternalWorkspaceTabs();
  opened.splice(0, opened.length);

  const [destination] = launcher.internalWorkspaceTabs;

  popupBudget = 1;
  const first = launcher.openInternalWorkspaceTabs([destination], 'all');
  assert.equal(first.opened, 1);
  assert.equal(first.remaining, 0);

  opened[0].handle.closed = true;

  popupBudget = 1;
  const reopened = launcher.openInternalWorkspaceTabs([destination], 'all');
  assert.equal(reopened.opened, 1);
  assert.equal(reopened.remaining, 0);
  assert.equal(opened.length, 2);
});
