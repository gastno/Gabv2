# Migration tracking and recovery

## Tracking table

The backend migration runner maintains `public.schema_migrations`:

| Column | Meaning |
| --- | --- |
| `version` | Numbered migration filename; the primary key. |
| `checksum` | SHA-256 of the migration file after CRLF line endings are normalized to LF. |
| `applied_at` | Database timestamp when the runner recorded the file. |

The runner reads numbered SQL files from `database/migrations` in filename order.
It serializes migration transactions with a PostgreSQL advisory lock and commits
each migration and its tracking row together. It checks recorded checksums on
subsequent runs; do not edit an applied migration. Add a new numbered file instead.
The tracking table itself is created before the migration transactions.

On an untracked database, the runner may recognize a current `init.sql` baseline
and record migrations without executing them. That baseline requires
`staff_availabilities`, no legacy `staff_schedules` table, the appointment
overlap constraint, and customer notification read state. A legacy schedule table
is intentionally preserved by migration 002, so its presence prevents this
baseline recognition even if the other schema objects already exist. In that case
the runner attempts to execute the unrecorded migrations in order. Review every
migration and its preconditions before running it on an untracked database; do
not insert tracking rows based only on a few matching schema objects.

`applied_at` records when the runner registered a migration, not necessarily
when the schema was first introduced. An adopted or replayed migration does not
prove the original deployment history or the provenance of the existing data.

## Checking a database

After confirming the target database and taking a backup, inspect the table with:

```sql
SELECT version, checksum, applied_at
FROM public.schema_migrations
ORDER BY version;
```

If the table does not exist, the history is unknown; inspect the schema, data,
and all migration preflight requirements before invoking the runner. Follow
[MIGRATIONS.md](./MIGRATIONS.md) for deployment and migration instructions.
Run the runner again after migration to verify recorded checksums and confirm
that there are no new migrations. Investigate checksum mismatches instead of
overwriting records or editing historical migration files.

## Recovery on 2026-11-09

The `appointment_db` database in the `gabv2_postgres_data` volume had no
`schema_migrations` table. Inspection found evidence of migrations 001-010 and
012, but neither `staff.email` nor the staff notification table from 011. The
legacy `staff_schedules` table was present and empty, so the baseline shortcut
did not apply. This evidence does not establish how or when earlier migrations
were applied.

A PostgreSQL custom-format database backup was made before migration and the
entire archive was read by `pg_restore`. The existing runner then executed and
recorded migrations 001-012; a second run reported zero new migrations. The
staff, staff-brand, staff-service, appointment, availability, unavailability,
and portfolio-image row counts were unchanged. Authenticated requests through
the frontend proxy returned staff, appointments, and historical availability.
No portfolio image records were present before or after recovery.

The archive is a point-in-time database backup, excludes ownership and ACL
statements, and does not include PostgreSQL cluster-wide roles or uploaded
files. Protect it as sensitive customer data, copy it to the designated secure
backup location, and independently back up uploads and cluster configuration.
Verify restores in an isolated database. Restoring this snapshot over the live
database would discard all subsequent changes; require an explicit recovery
decision and stop application writes before any live restore.
