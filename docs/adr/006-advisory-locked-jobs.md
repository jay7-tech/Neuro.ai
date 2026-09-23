# ADR-006: Background jobs with Postgres advisory locks

**Status:** accepted

## Context

Missed-dose detection has to run on a schedule, even when nobody has the app open. Deployments may run several worker replicas.

## Decision

A small interval scheduler runs each job in a transaction that first takes `pg_try_advisory_xact_lock`. Jobs are idempotent (`ON CONFLICT DO NOTHING` and alert de-duplication keys), and outcomes are recorded in `job_runs`.

## Consequences

- Exactly one replica runs each tick, with no leader election or queue service. Locks are released on crash.
- Re-running a job over the same window is safe, so a retry never double-alerts.
- If jobs outgrow a single transaction, the next step is a Postgres-backed queue (for example pg-boss) behind the same `Job` interface.
