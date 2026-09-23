# ADR-005: Deterministic difficulty policy instead of an LLM

**Status:** accepted (replaces the prototype's `adjustGameDifficulty` Genkit flow)

## Context

The prototype asked an LLM to choose the next difficulty level. That was non-deterministic, cost money on every game, added latency, and couldn't be explained to a clinician.

## Decision

Score each session as `0.6·accuracy + 0.25·speed + 0.15·(1 − mistakeRate)`. Promote after 3 consecutive sessions scoring ≥ 0.80, and demote after 2 consecutive sessions scoring ≤ 0.45. The thresholds are asymmetric on purpose, because frustration costs more than boredom for this population. The stored `performance` values also feed the clinician's weekly trend.

## Consequences

- Same inputs always give the same level. The policy is unit-tested and free to run.
- LLMs are used only where language is the product: the companion and reading a pack photo.
