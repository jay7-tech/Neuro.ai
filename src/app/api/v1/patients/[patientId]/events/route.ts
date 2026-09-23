import { handler } from '@/server/http/handler';
import { requireAccess } from '@/server/services/access';
import { subscriber } from '@/server/realtime/bus';
import { PatientParams } from '@/lib/contracts';

export const dynamic = 'force-dynamic';

const HEARTBEAT_MS = 25_000;

/**
 * Server-Sent Events stream of a patient's domain events.
 *
 * SSE over WebSockets: traffic is one-way (server → client), it rides plain HTTP
 * (proxies, auth cookies and HTTP/2 multiplexing just work) and the browser
 * reconnects automatically. Heartbeats keep idle proxies from closing the stream.
 */
export const GET = handler({ params: PatientParams, rateLimit: false }, async ({ db, actor, params, req }) => {
  await requireAccess(db, actor, params.patientId, 'patient:read');
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };
      send(`retry: 3000\n: connected\n\n`);
      const unsubscribe = subscriber().subscribe(params.patientId, (event) => {
        send(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
      });
      const heartbeat = setInterval(() => send(`: ping\n\n`), HEARTBEAT_MS);
      let closed = false;
      function cleanup() {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
      req.signal.addEventListener('abort', cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
});
