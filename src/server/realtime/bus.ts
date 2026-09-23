import { Client } from 'pg';
import { sql } from 'drizzle-orm';
import type { Executor } from '../db/client';
import { logger } from '../logger';
import { EVENTS_CHANNEL, type PatientEvent, type PatientEventType } from './events';

/**
 * Cross-instance event bus on Postgres LISTEN/NOTIFY.
 *
 * Publishing is a `pg_notify` issued on the *same* executor as the write, so when it
 * runs inside a transaction Postgres only delivers it on COMMIT — subscribers never see
 * an event for data that was rolled back. Each web instance keeps one dedicated LISTEN
 * connection and fans out to its local SSE subscribers, so this scales horizontally
 * without Redis.
 */
export async function publish(db: Executor, patientId: string, type: PatientEventType, id?: string): Promise<void> {
  const event: PatientEvent = { patientId, type, id, at: new Date().toISOString() };
  await db.execute(sql`select pg_notify(${EVENTS_CHANNEL}, ${JSON.stringify(event)})`);
}

type Listener = (event: PatientEvent) => void;

class Subscriber {
  private client: Client | null = null;
  private connecting: Promise<void> | null = null;
  private readonly listeners = new Map<string, Set<Listener>>();
  private retryMs = 1_000;

  subscribe(patientId: string, fn: Listener): () => void {
    const set = this.listeners.get(patientId) ?? new Set();
    set.add(fn);
    this.listeners.set(patientId, set);
    void this.ensureConnected();
    return () => {
      set.delete(fn);
      if (set.size === 0) this.listeners.delete(patientId);
    };
  }

  get subscriberCount(): number {
    let n = 0;
    for (const s of this.listeners.values()) n += s.size;
    return n;
  }

  private ensureConnected(): Promise<void> {
    if (this.client) return Promise.resolve();
    this.connecting ??= this.connect().finally(() => {
      this.connecting = null;
    });
    return this.connecting;
  }

  private async connect(): Promise<void> {
    const client = new Client({ connectionString: process.env.DATABASE_URL, application_name: 'neuro-ai-listener' });
    client.on('notification', (msg) => {
      if (msg.channel !== EVENTS_CHANNEL || !msg.payload) return;
      try {
        const event = JSON.parse(msg.payload) as PatientEvent;
        for (const fn of this.listeners.get(event.patientId) ?? []) fn(event);
      } catch (err) {
        logger.warn({ err }, 'dropping malformed realtime payload');
      }
    });
    client.on('error', (err) => {
      logger.error({ err }, 'realtime listener connection lost; reconnecting');
      this.client = null;
      void client.end().catch(() => undefined);
      setTimeout(() => void this.ensureConnected(), this.retryMs);
      this.retryMs = Math.min(this.retryMs * 2, 30_000);
    });
    try {
      await client.connect();
      await client.query(`LISTEN ${EVENTS_CHANNEL}`);
      this.client = client;
      this.retryMs = 1_000;
      logger.info('realtime listener connected');
    } catch (err) {
      logger.error({ err }, 'realtime listener failed to connect');
      setTimeout(() => void this.ensureConnected(), this.retryMs);
      this.retryMs = Math.min(this.retryMs * 2, 30_000);
    }
  }
}

const g = globalThis as typeof globalThis & { __neuroSubscriber?: Subscriber };
export function subscriber(): Subscriber {
  g.__neuroSubscriber ??= new Subscriber();
  return g.__neuroSubscriber;
}
