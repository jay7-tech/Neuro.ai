# ADR-002: Server-side sessions instead of JWTs

**Status:** accepted

## Context

The users include vulnerable patients. When a caregiver's phone is lost, access has to be cut off immediately.

## Decision

Use opaque 256-bit tokens in an `httpOnly`, `SameSite=Lax` cookie. Only the token's SHA-256 is stored in `sessions`. Sessions slide: they are extended on use once past half their TTL.

## Consequences

- Revocation happens immediately (delete the row), which a stateless JWT can't offer before it expires.
- A database leak doesn't expose usable tokens.
- Each request costs one indexed lookup, which is negligible at this scale and could be cached if needed.
- Cookie authentication needs CSRF protection: SameSite plus an Origin check on mutating requests.
