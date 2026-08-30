export type TelemetrySeverity = 'debug' | 'info' | 'warn' | 'error';

export interface JsonObject {
  readonly [key: string]: JsonValue;
}

export interface JsonArray extends ReadonlyArray<JsonValue> {}

export type JsonValue = string | number | boolean | null | JsonArray | JsonObject;

type JsonEntry = readonly [string, JsonValue];

export interface TelemetryIdentity {
  readonly clientId: string;
  readonly app: string;
  readonly platform: string;
  readonly traceId: string;
}

export interface TelemetryEventInput {
  readonly severity: TelemetrySeverity;
  readonly eventName: string;
  readonly message?: string;
  readonly context: Readonly<Record<string, unknown>>;
  readonly occurredAt: string;
}

export interface TelemetryEvent {
  readonly client_id: string;
  readonly app: string;
  readonly platform: string;
  readonly severity: TelemetrySeverity;
  readonly event_name: string;
  readonly message?: string;
  readonly trace_id: string;
  readonly context: Readonly<Record<string, JsonValue>>;
  readonly occurred_at: string;
}

export interface TelemetryQueuePolicy {
  readonly maxQueue: number;
  readonly maxBatch: number;
}

export interface TelemetryQueueState {
  readonly events: readonly TelemetryEvent[];
  readonly dropped: number;
}

export const TELEMETRY_QUEUE_POLICY: TelemetryQueuePolicy = Object.freeze({
  maxQueue: 100,
  maxBatch: 25,
});

export type EnqueueTransition =
  | Readonly<{
      kind: 'defer';
      state: TelemetryQueueState;
    }>
  | Readonly<{
      kind: 'flush';
      reason: 'error' | 'batch-full';
      state: TelemetryQueueState;
    }>;

export type BatchTransition =
  | Readonly<{
      kind: 'empty';
      state: TelemetryQueueState;
    }>
  | Readonly<{
      kind: 'ready';
      batch: readonly TelemetryEvent[];
      state: TelemetryQueueState;
    }>;

const sensitiveKey = /authorization|cookie|password|secret|token|api[_-]?key|session/i;
const jwtLike = /\beyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+\b/g;
const emailLike = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

export function emptyTelemetryQueue(): TelemetryQueueState {
  return { events: [], dropped: 0 };
}

export function createTelemetryEvent(
  identity: TelemetryIdentity,
  input: TelemetryEventInput,
): TelemetryEvent {
  return {
    client_id: identity.clientId,
    app: boundedText(identity.app, 96),
    platform: boundedText(identity.platform, 48),
    severity: input.severity,
    event_name: boundedText(input.eventName || 'client.event', 128),
    message: input.message === undefined
      ? undefined
      : boundedText(redactText(input.message), 4096),
    trace_id: identity.traceId,
    context: redactContext(input.context),
    occurred_at: input.occurredAt,
  };
}

export function enqueueTelemetryEvent(
  state: TelemetryQueueState,
  event: TelemetryEvent,
  policy: TelemetryQueuePolicy,
): EnqueueTransition {
  const appended = [...state.events, event];
  const overflow = Math.max(0, appended.length - policy.maxQueue);
  const nextState: TelemetryQueueState = {
    events: appended.slice(overflow),
    dropped: state.dropped + overflow,
  };

  if (event.severity === 'error') {
    return { kind: 'flush', reason: 'error', state: nextState };
  }
  if (nextState.events.length >= policy.maxBatch) {
    return { kind: 'flush', reason: 'batch-full', state: nextState };
  }
  return { kind: 'defer', state: nextState };
}

export function takeTelemetryBatch(
  state: TelemetryQueueState,
  policy: TelemetryQueuePolicy,
): BatchTransition {
  if (state.events.length === 0) return { kind: 'empty', state };

  return {
    kind: 'ready',
    batch: state.events.slice(0, policy.maxBatch),
    state: {
      events: state.events.slice(policy.maxBatch),
      dropped: state.dropped,
    },
  };
}

export function requeueTelemetryBatch(
  state: TelemetryQueueState,
  batch: readonly TelemetryEvent[],
  policy: TelemetryQueuePolicy,
): TelemetryQueueState {
  const requeued = [...batch, ...state.events];
  const overflow = Math.max(0, requeued.length - policy.maxQueue);
  return {
    events: requeued.slice(0, policy.maxQueue),
    dropped: state.dropped + overflow,
  };
}

export function redactContext(
  value: unknown,
  depth = 0,
): Readonly<Record<string, JsonValue>> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || depth > 3) return {};

  const entries = Object.entries(value as Record<string, unknown>)
    .map(([key, raw]) => redactEntry(key, raw, depth))
    .filter((entry): entry is JsonEntry => entry !== undefined);
  return Object.fromEntries(entries);
}

function redactEntry(key: string, raw: unknown, depth: number): JsonEntry | undefined {
  if (sensitiveKey.test(key)) return [key, '[REDACTED]'];
  if (typeof raw === 'string') return [key, boundedText(redactText(raw), 2048)];
  if (typeof raw === 'number' || typeof raw === 'boolean' || raw === null) return [key, raw];
  if (Array.isArray(raw)) {
    const redacted = raw.slice(0, 20).map((entry) =>
      typeof entry === 'string' ? boundedText(redactText(entry), 512) : String(entry)
    );
    return [key, redacted];
  }
  if (typeof raw === 'object') return [key, redactContext(raw, depth + 1)];
  return undefined;
}

export function redactText(value: string): string {
  return value.replace(jwtLike, '[REDACTED_JWT]').replace(emailLike, '[REDACTED_EMAIL]');
}

export function boundedText(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, Math.max(0, max - 1))}…`;
}

export function safeOrigin(value: string): string {
  try {
    return value ? new URL(value).origin : '';
  } catch {
    return '';
  }
}

export function safePath(value: string): string {
  try {
    return new URL(value).pathname;
  } catch {
    return '';
  }
}
