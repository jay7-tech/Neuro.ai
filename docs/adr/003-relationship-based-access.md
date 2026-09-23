# ADR-003: Relationship-based access control

**Status:** accepted

## Context

A clinician may be on some patients' care teams and not others. One caregiver may look after two relatives. Account-level roles ("is a clinician") can't express who may see whom.

## Decision

Permissions come from the `care_team_members.role` the actor holds on the specific patient. The rules live in a pure `can(role, action)` matrix. Joining a team requires a single-use, 72-hour invite code, stored as a hash.

## Consequences

- The whole policy can be unit-tested and reviewed in one file.
- Non-members get `404`, so patient IDs can't be enumerated.
- Adding a role such as "family viewer" means adding one row to the matrix.
