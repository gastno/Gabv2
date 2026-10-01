# Database Migrations

PostgreSQL runs as Docker Compose service `postgres_db` and stores data in a persistent volume. Never remove that volume to apply a schema change.

## Booking Integrity Migration

Apply `migrations/001_booking_integrity.sql` to an existing installation before deploying the booking API changes. Back up the database first, review its preflight findings, and run it during a maintenance window: timestamp type changes and exclusion/index creation can lock tables.

The migration assumes legacy `appointments` and `staff_unavailabilities` timestamps were Iceland-local wall times and converts them using PostgreSQL's `Atlantic/Reykjavik` timezone name. The API identifies the same zone as `Europe/Reykjavik`. Review representative records against the expected calendar times before applying it. New API timestamps must be ISO 8601 with an explicit offset; availability dates are `YYYY-MM-DD` in `Europe/Reykjavik`. Availability is returned in 15-minute increments.

The customer policy is one profile per Kennitala, ignoring punctuation. Guest bookings reuse that profile; registered bookings require a customer token. Registration does not claim an existing guest profile until an ownership-verification flow exists, preventing transfer of appointment history using Kennitala alone. The migration does not merge existing duplicate profiles because appointment history, email ownership, and registered credentials require an operator decision. It stops with customer ID groups, which must be reconciled manually and backed up before retrying.

For each reported duplicate group, review the profiles in a restricted maintenance session, choose a canonical profile only after confirming account ownership, and repoint appointment references before removing duplicate rows. Preserve appointment history and consent data; do not merge credentials or email addresses without verifying ownership. Avoid printing Kennitalas or health information into migration logs, and take a backup before any reconciliation.

The migration also stops with IDs when it finds active overlaps, invalid time ranges, overnight schedules, or appointment/service/staff brand mismatches. Reconcile those records before retrying. It is safe to rerun after a successful or interrupted application.

The backend unit tests run with `npm test --prefix backend`. PostgreSQL overlap boundary/concurrency coverage is opt-in: set `BOOKING_TEST_DATABASE_URL` to a disposable database whose name includes `test`, then run `npm test --prefix backend`. The integration test creates and drops a uniquely named schema; never point it at deployed data.

Use the configured database user/database for the deployment. From PowerShell, the Compose service can receive the migration over standard input without mounting the file into the container:

```powershell
Get-Content -Raw database/migrations/001_booking_integrity.sql | docker compose exec -T postgres_db psql -U $env:POSTGRES_USER -d $env:POSTGRES_DB
```

Set those environment variables to the deployment's actual PostgreSQL credentials first; do not use repository development defaults against a deployed database. The command is intentionally not run as part of code validation.

## Date-Specific Staff Availability

Apply `migrations/002_date_specific_staff_availability.sql` before deploying the date-specific availability API. It creates `staff_availabilities`, whose rows belong to one calendar date and contain a same-day start/end time. `staff_schedules` is left intact as legacy data and is no longer read by the backend; weekly rows are not expanded into dates because that would invent availability. Back up first and apply with the same Docker Compose procedure above, substituting the `002` migration filename.