import assert from 'node:assert/strict';
import test from 'node:test';

import {
  boundedText,
  createTelemetryEvent,
  emptyTelemetryQueue,
  enqueueTelemetryEvent,
  redactContext,
  requeueTelemetryBatch,
  safeOrigin,
  safePath,
  takeTelemetryBatch,
} from '../src/lib/telemetry-core.ts';

const identity = Object.freeze({
  clientId: 'client-1',
  app: 'benefactor-web',
  platform: 'web',
  traceId: 'trace-1',
});

function event(sequence, severity = 'info') {
  return createTelemetryEvent(identity, {
    severity,
    eventName: `event.${sequence}`,
    context: { sequence },
    occurredAt: `2026-08-29T00:00:0${sequence}.000Z`,
  });
}

test('event creation is deterministic and redacts sensitive input', () => {
  const created = createTelemetryEvent(identity, {
    severity: 'warn',
    eventName: '',
    message: 'contact person@example.com with eyJabcdefghijk.abc.signature',
    context: {
      authorization: 'Bearer secret',
      nested: { email: 'person@example.com' },
    },
    occurredAt: '2026-08-29T12:00:00.000Z',
  });

  assert.deepEqual(created, {
    client_id: 'client-1',
    app: 'benefactor-web',
    platform: 'web',
    severity: 'warn',
    event_name: 'client.event',
    message: 'contact [REDACTED_EMAIL] with [REDACTED_JWT]',
    trace_id: 'trace-1',
    context: {
      authorization: '[REDACTED]',
      nested: { email: '[REDACTED_EMAIL]' },
    },
    occurred_at: '2026-08-29T12:00:00.000Z',
  });
});

test('queue transitions preserve immutability and report pressure explicitly', () => {
  const policy = { maxQueue: 2, maxBatch: 2 };
  const initial = emptyTelemetryQueue();
  const first = enqueueTelemetryEvent(initial, event(1), policy);
  const second = enqueueTelemetryEvent(first.state, event(2), policy);
  const third = enqueueTelemetryEvent(second.state, event(3), policy);

  assert.equal(first.kind, 'defer');
  assert.deepEqual(initial, { events: [], dropped: 0 });
  assert.deepEqual(
    { kind: second.kind, reason: second.reason },
    { kind: 'flush', reason: 'batch-full' },
  );
  assert.equal(third.state.dropped, 1);
  assert.deepEqual(third.state.events.map((queued) => queued.event_name), ['event.2', 'event.3']);
});

test('batch take and persistence retry are explicit state transitions', () => {
  const policy = { maxQueue: 3, maxBatch: 2 };
  const queued = [event(1), event(2), event(3)];
  const transition = takeTelemetryBatch({ events: queued, dropped: 4 }, policy);

  assert.equal(transition.kind, 'ready');
  assert.deepEqual(transition.batch.map((item) => item.event_name), ['event.1', 'event.2']);
  assert.deepEqual(transition.state.events.map((item) => item.event_name), ['event.3']);

  const retried = requeueTelemetryBatch(transition.state, transition.batch, policy);
  assert.deepEqual(retried.events.map((item) => item.event_name), ['event.1', 'event.2', 'event.3']);
  assert.equal(retried.dropped, 4);
});

test('redaction and URL projections are total pure helpers', () => {
  assert.deepEqual(redactContext(null), {});
  assert.equal(boundedText('abcdef', 4), 'abc…');
  assert.equal(safeOrigin('https://benefactor.cc/team?token=hidden'), 'https://benefactor.cc');
  assert.equal(safePath('https://benefactor.cc/team?token=hidden'), '/team');
  assert.equal(safeOrigin('not a URL'), '');
  assert.equal(safePath('not a URL'), '');
});
