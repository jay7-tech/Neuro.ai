# ADR-004: Realtime with Server-Sent Events over Postgres LISTEN/NOTIFY

**Status:** accepted

## Context

Caregivers need to see alerts and messages as they happen, and the web tier must be able to run more than one instance.

## Decision

Services call `pg_notify` inside their transaction. Each web instance holds one `LISTEN` connection and fans events out to its SSE clients. Events carry only IDs, and clients refetch through the API.

## Alternatives considered

- **WebSockets:** traffic is one-way (server to client). SSE reconnects automatically and works through ordinary HTTP infrastructure and cookie auth.
- **Redis pub/sub:** another service to run, for no gain at this scale.
- **Polling:** simple, but slower and more wasteful.

## Consequences

- Notifications are only delivered on commit, so rolled-back work is never broadcast.
- The design scales horizontally without a broker. If fan-out grows beyond Postgres' comfort zone, the `publish`/`subscribe` seam can be moved to Redis.
