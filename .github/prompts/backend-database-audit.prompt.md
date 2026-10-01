---
name: Backend and Database Audit
description: "Review Gabv2 API endpoints and PostgreSQL schema to establish current behavior, risks, and a prioritized plan for future backend changes."
argument-hint: "Optional focus area, such as appointments, staff availability, or authorization"
agent: "Backend and Database"
tools: [read, search]
---

Perform a read-only assessment of the current Gabv2 backend endpoints and database for future development planning.

Optional focus area:
$ARGUMENTS

If no focus area is provided, cover the full backend and database surface.

## Scope and Constraints

- Inspect `backend/src/routes/`, their controllers and middleware, `backend/src/config/db.js`, `database/init.sql`, and `database/seed_db.py`. Read related frontend API calls only when needed to establish request/response contracts.
- Make no code, schema, migration, seed, or configuration changes. Do not connect to or modify a live database, run seed scripts, expose `.env` values, or perform destructive commands.
- Verify every finding against the current implementation. Treat [AGENTS.md](../../AGENTS.md) as useful context and backlog, not proof that a listed gap is still open or resolved.
- Distinguish implemented behavior from partial behavior, missing behavior, and risks inferred from code. Note when a contract cannot be verified without running against a configured database.

## Review Tasks

1. Inventory each registered endpoint: method/path, route file, controller handler, public/authenticated access, role checks, and frontend consumer when identifiable.
2. Map endpoint behavior to the relevant tables, relationships, constraints, enums, indexes, and seed assumptions.
3. Assess input validation, authorization and brand/record scoping, transaction boundaries, concurrency risks, error responses, and sensitive customer-data exposure. Identify behavior that currently relies only on client-side checks.
4. Identify mismatches or missing pieces between backend contracts, schema, and current frontend API calls. Do not propose a new contract without stating the exact gap it resolves.
5. Recommend a sequenced, minimal plan for future backend/database work. Call out dependencies, schema migration needs for existing installations, and focused tests required for each high-risk change.

## Output

Keep the report actionable and grounded in file paths. Use these sections:

- **Current Endpoint Inventory**: compact table of route, behavior, access control, and database entities.
- **Schema and Contract Findings**: verified relationships, contract mismatches, and missing endpoints.
- **Risks**: highest priority first, each with evidence and impact.
- **Recommended Sequence**: ordered next steps, prerequisites, and suggested focused tests.
- **Unknowns**: environment- or database-dependent facts that could not be verified read-only.

Do not implement the recommendations during this audit.