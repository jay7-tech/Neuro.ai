# ADR-001: PostgreSQL with Drizzle ORM

**Status:** accepted

## Context

The prototype kept everything in `localStorage`, so data was per-browser, unshared and trivially lost. The domain is relational (patients ↔ care teams ↔ medications ↔ doses) and depends on integrity guarantees: idempotent dose slots, one open alert per condition, single-use invites.

## Decision

Use PostgreSQL 16 and Drizzle ORM, with SQL migrations generated from a TypeScript schema.

## Consequences

- Constraints do the correctness work: unique and partial unique indexes, `CHECK`s and row locks.
- Drizzle is close to SQL, so aggregate queries (weekly game performance, unread counts) stay readable and typed, with no query-engine binary to ship.
- Postgres also covers pub/sub (`LISTEN/NOTIFY`) and distributed locking (advisory locks), so no second datastore is needed yet.
