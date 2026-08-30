import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import {
  createTelemetryEvent,
  emptyTelemetryQueue,
  enqueueTelemetryEvent,
  requeueTelemetryBatch,
  safeOrigin,
  safePath,
  takeTelemetryBatch,
  TELEMETRY_QUEUE_POLICY,
  type TelemetryIdentity,
  type TelemetryQueueState,
  type TelemetrySeverity,
} from './telemetry-core';

export interface ClientTelemetrySession {
  readonly accessToken: string;
  readonly userId: string;
}

export interface ClientTelemetryConfig {
  readonly app: string;
  readonly platform: string;
  readonly supabaseUrl?: string;
  readonly publishableKey?: string;
  readonly schema?: string;
  readonly session?: ClientTelemetrySession;
}

const FLUSH_INTERVAL_MS = 2_500;

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
  private readonly identity: TelemetryIdentity;
  private queue: TelemetryQueueState = emptyTelemetryQueue();
  private client?: SupabaseClient;
  private channel?: RealtimeChannel;
  private sessionUserId?: string;
  private flushTimer?: number;

  constructor(config: ClientTelemetryConfig) {
    this.config = {
      ...config,
      app: config.app,
      platform: config.platform,
      schema: config.schema ?? 'benefactor-cc',
    };
    this.identity = {
      clientId: crypto.randomUUID(),
      app: this.config.app,
      platform: this.config.platform,
      traceId: crypto.randomUUID(),
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
    if (this.sessionUserId && this.sessionUserId !== session.userId) {
      this.queue = emptyTelemetryQueue();
    }
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
    if (!this.client || !this.channel) return;

    const transition = takeTelemetryBatch(this.queue, TELEMETRY_QUEUE_POLICY);
    if (transition.kind === 'empty') return;

    this.queue = transition.state;
    const events = [...transition.batch];
    const payload = { trace_id: this.identity.traceId, events };
    const [broadcast, durable] = await Promise.allSettled([
      this.channel.send({ type: 'broadcast', event: 'client-telemetry', payload }),
      this.client.schema(this.config.schema ?? 'benefactor-cc').rpc('ingest_client_telemetry', {
        p_events: events,
      }),
    ]);
    // Realtime is a live tail; the constrained RPC is the durable source of
    // truth. Retry only when persistence fails, keeping data bounded.
    if (durable.status === 'rejected') {
      this.queue = requeueTelemetryBatch(this.queue, events, TELEMETRY_QUEUE_POLICY);
    }
    if (broadcast.status === 'rejected') console.debug('client telemetry broadcast unavailable');
  }

  dispose(): void {
    if (this.flushTimer) window.clearInterval(this.flushTimer);
    void this.flush();
    if (this.channel) void this.client?.removeChannel(this.channel);
  }

  private record(
    severity: TelemetrySeverity,
    eventName: string,
    message: string | undefined,
    context: Readonly<Record<string, unknown>>,
  ): void {
    const event = createTelemetryEvent(this.identity, {
      severity,
      eventName,
      message,
      context,
      occurredAt: new Date().toISOString(),
    });
    const transition = enqueueTelemetryEvent(this.queue, event, TELEMETRY_QUEUE_POLICY);
    this.queue = transition.state;
    if (transition.kind === 'flush') void this.flush();
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
        dropped_events: this.queue.dropped,
      });
    });
  }
}

export function installClientTelemetry(config: ClientTelemetryConfig): ClientTelemetry {
  const telemetry = new ClientTelemetry(config);
  window.benefactorTelemetry = telemetry;
  return telemetry;
}
