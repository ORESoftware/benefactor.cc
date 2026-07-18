import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';

type Severity = 'debug' | 'info' | 'warn' | 'error';
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface ClientTelemetrySession {
  accessToken: string;
  userId: string;
}

export interface ClientTelemetryConfig {
  app: string;
  platform: string;
  supabaseUrl?: string;
  publishableKey?: string;
  schema?: string;
  session?: ClientTelemetrySession;
}

interface TelemetryEvent {
  client_id: string;
  app: string;
  platform: string;
  severity: Severity;
  event_name: string;
  message?: string;
  trace_id: string;
  context: Record<string, JsonValue>;
  occurred_at: string;
}

const MAX_QUEUE = 100;
const MAX_BATCH = 25;
const FLUSH_INTERVAL_MS = 2_500;
const sensitiveKey = /authorization|cookie|password|secret|token|api[_-]?key|session/i;
const jwtLike = /\beyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+\b/g;
const emailLike = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

declare global {
  interface Window {
    benefactorTelemetry?: ClientTelemetry;
  }
}

/**
 * Browser telemetry is deliberately session-bound. The static marketing site
 * does not place a bearer token in localStorage; an authenticated server layer
 * can later call `setSession` with a short-lived access token kept out of page
 * source. Until then, events stay in the bounded in-memory queue only.
 */
export class ClientTelemetry {
  private readonly config: Required<Pick<ClientTelemetryConfig, 'app' | 'platform'>> & ClientTelemetryConfig;
  private readonly clientId = crypto.randomUUID();
  private readonly traceId = crypto.randomUUID();
  private queue: TelemetryEvent[] = [];
  private client?: SupabaseClient;
  private channel?: RealtimeChannel;
  private sessionUserId?: string;
  private flushTimer?: number;
  private dropped = 0;

  constructor(config: ClientTelemetryConfig) {
    this.config = {
      ...config,
      app: config.app,
      platform: config.platform,
      schema: config.schema ?? 'benefactor-cc',
    };
    this.installGlobalHandlers();
    this.flushTimer = window.setInterval(() => void this.flush(), FLUSH_INTERVAL_MS);
    window.addEventListener('pagehide', () => void this.flush());
    // A future Jaspr authentication boundary can exchange an HttpOnly session
    // server-side, then hand this short-lived access token to the telemetry
    // transport only. Nothing here reads or persists browser auth storage.
    window.addEventListener('benefactor:telemetry-auth', (event) => {
      const session = (event as CustomEvent<ClientTelemetrySession>).detail;
      if (session?.accessToken && session.userId) void this.setSession(session);
    });
    if (config.session) void this.setSession(config.session);
    this.info('client.started', 'Client observability initialized', {
      pathname: location.pathname,
      referrer_origin: safeOrigin(document.referrer),
    });
  }

  async setSession(session: ClientTelemetrySession): Promise<void> {
    if (!this.config.supabaseUrl || !this.config.publishableKey || !session.accessToken || !session.userId) {
      return;
    }
    if (this.sessionUserId && this.sessionUserId !== session.userId) this.queue = [];
    if (this.channel) await this.client?.removeChannel(this.channel);
    this.client = createClient(this.config.supabaseUrl, this.config.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${session.accessToken}` } },
    });
    await this.client.realtime.setAuth(session.accessToken);
    this.channel = this.client.channel(`client-telemetry:${session.userId}`, {
      config: { private: true, broadcast: { ack: false, self: false } },
    });
    this.sessionUserId = session.userId;
    this.channel.subscribe();
    await this.flush();
  }

  debug(eventName: string, message?: string, context: Record<string, unknown> = {}): void {
    this.record('debug', eventName, message, context);
  }

  info(eventName: string, message?: string, context: Record<string, unknown> = {}): void {
    this.record('info', eventName, message, context);
  }

  warn(eventName: string, message?: string, context: Record<string, unknown> = {}): void {
    this.record('warn', eventName, message, context);
  }

  error(eventName: string, message?: string, context: Record<string, unknown> = {}): void {
    this.record('error', eventName, message, context);
  }

  async flush(): Promise<void> {
    if (!this.client || !this.channel || this.queue.length === 0) return;
    const events = this.queue.splice(0, MAX_BATCH);
    const payload = { trace_id: this.traceId, events };
    const [broadcast, durable] = await Promise.allSettled([
      this.channel.send({ type: 'broadcast', event: 'client-telemetry', payload }),
      this.client.schema(this.config.schema ?? 'benefactor-cc').rpc('ingest_client_telemetry', {
        p_events: events,
      }),
    ]);
    // Realtime is a live tail; the constrained RPC is the durable source of
    // truth. Retry only when persistence fails, keeping data bounded.
    if (durable.status === 'rejected') this.requeue(events);
    if (broadcast.status === 'rejected') console.debug('client telemetry broadcast unavailable');
  }

  dispose(): void {
    if (this.flushTimer) window.clearInterval(this.flushTimer);
    void this.flush();
    if (this.channel) void this.client?.removeChannel(this.channel);
  }

  private record(
    severity: Severity,
    eventName: string,
    message: string | undefined,
    context: Record<string, unknown>,
  ): void {
    const event: TelemetryEvent = {
      client_id: this.clientId,
      app: bounded(this.config.app, 96),
      platform: bounded(this.config.platform, 48),
      severity,
      event_name: bounded(eventName || 'client.event', 128),
      message: message ? bounded(redactText(message), 4096) : undefined,
      trace_id: this.traceId,
      context: redactObject(context),
      occurred_at: new Date().toISOString(),
    };
    this.queue.push(event);
    if (this.queue.length > MAX_QUEUE) {
      this.queue.shift();
      this.dropped += 1;
    }
    if (severity === 'error' || this.queue.length >= MAX_BATCH) void this.flush();
  }

  private requeue(events: TelemetryEvent[]): void {
    this.queue = [...events, ...this.queue].slice(0, MAX_QUEUE);
  }

  private installGlobalHandlers(): void {
    window.addEventListener('error', (event) => {
      this.error('window.error', event.message, {
        filename: safePath(event.filename),
        line: event.lineno,
        column: event.colno,
        stack: event.error instanceof Error ? event.error.stack ?? '' : '',
      });
    });
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      this.error('window.unhandled_rejection', reason.message, { stack: reason.stack ?? '' });
    });
    window.addEventListener('pagehide', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      this.info('navigation.complete', undefined, {
        pathname: location.pathname,
        duration_ms: navigation ? Math.round(navigation.duration) : undefined,
        dropped_events: this.dropped,
      });
    });
  }
}

export function installClientTelemetry(config: ClientTelemetryConfig): ClientTelemetry {
  const telemetry = new ClientTelemetry(config);
  window.benefactorTelemetry = telemetry;
  return telemetry;
}

function redactObject(value: unknown, depth = 0): Record<string, JsonValue> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || depth > 3) return {};
  const output: Record<string, JsonValue> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (sensitiveKey.test(key)) {
      output[key] = '[REDACTED]';
    } else if (typeof raw === 'string') {
      output[key] = bounded(redactText(raw), 2048);
    } else if (typeof raw === 'number' || typeof raw === 'boolean' || raw === null) {
      output[key] = raw;
    } else if (Array.isArray(raw)) {
      output[key] = raw.slice(0, 20).map((entry) => typeof entry === 'string' ? bounded(redactText(entry), 512) : String(entry));
    } else if (typeof raw === 'object') {
      output[key] = redactObject(raw, depth + 1);
    }
  }
  return output;
}

function redactText(value: string): string {
  return value.replace(jwtLike, '[REDACTED_JWT]').replace(emailLike, '[REDACTED_EMAIL]');
}

function bounded(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, Math.max(0, max - 1))}…`;
}

function safeOrigin(value: string): string {
  try { return value ? new URL(value).origin : ''; } catch { return ''; }
}

function safePath(value: string): string {
  try { const url = new URL(value); return url.pathname; } catch { return ''; }
}
