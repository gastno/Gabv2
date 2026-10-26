# Deployment and recovery

The root `docker-compose.yml` is for local PostgreSQL development only. `compose.production.yml` runs PostgreSQL, the API, and the static web app with separate health checks, a private database network, persistent database/uploads volumes, non-root application images, read-only root filesystems, and file-mounted database/JWT secrets. It does not provide TLS; put a maintained HTTPS reverse proxy in front of the web/API ports.

## Production configuration

1. Copy `deploy/.env.production.example` to a protected deployment `.env.production` file and replace every example hostname and secret path. Keep the file out of source control.
2. Create separate, random PostgreSQL and JWT secret files on the deployment host. Restrict them to the deployment operator and Docker (`0600` where supported). Configure `POSTGRES_PASSWORD_FILE` and `JWT_SECRET_FILE` to their absolute paths. The JWT secret must be at least 32 characters and must not be a placeholder.
3. Set `PUBLIC_API_URL` to the public HTTPS API URL ending in `/api`. Set `CORS_ORIGINS` to the exact HTTPS web origin(s), with no paths or trailing slash. The mobile app uses the same public API URL in `mobile/.env` as `EXPO_PUBLIC_API_URL`.
4. Configure provider values when those integrations are enabled. `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are required for actual notification email delivery. Clerk values are required for the web Clerk sign-in flow. The app starts without these optional providers, but their related operations will not work.

Run Compose commands with the production env file:

```sh
docker compose --env-file .env.production -f compose.production.yml config --quiet
docker compose --env-file .env.production -f compose.production.yml up -d postgres_db
```

On a new, empty database volume, PostgreSQL runs `database/init.sql` once to create the current schema. Existing volumes are never reinitialized by Compose. Back up existing data and review the migration preflight notes before applying schema changes:

```sh
docker compose --env-file .env.production -f compose.production.yml \
  --profile maintenance run --rm migrate
docker compose --env-file .env.production -f compose.production.yml \
  up -d --build api web
```

The migration runner applies numbered SQL files in order, records SHA-256 checksums, serializes concurrent runners with a PostgreSQL advisory lock, and executes each migration and its record in one transaction. An applied migration must not be edited; add a new numbered migration instead. Legacy databases that were migrated manually can be adopted by the runner when their migrations are safely repeatable. The booking-integrity migration intentionally stops for records requiring operator reconciliation; do not bypass those checks. Review [database/MIGRATIONS.md](./database/MIGRATIONS.md) for migration-specific data risks.

The API listens on the host loopback address by default at port 5000, and the web container at port 8080. Configure the reverse proxy to route the public HTTPS API host to the API port and the web host to the web port. If the proxy is in a different container/network, explicitly configure safe bind addresses and network access rather than exposing PostgreSQL. API readiness is `/health/ready`, liveness is `/health/live`, and the web container health endpoint is `/health`.

The first owner/admin, brands, staff, services, and schedules must be provisioned through an approved restricted operator process. The local seed utility now requires explicit database and initial-admin credentials; do not reuse local credentials or run a sample account in production.

## Backups, restore, and rollback

- Back up PostgreSQL before every migration and on a scheduled basis. Retain encrypted copies outside the host and test restoration to an isolated database.
- Back up the `appointment_uploads` volume as well as PostgreSQL. Appointment reference images are stored in PostgreSQL; uploaded brand/staff assets are stored in the uploads volume.
- Never use `docker compose down -v` on a database containing data. A normal `docker compose down` leaves named volumes intact.
- For recovery, stop application writes, restore the database and uploads from a consistent backup, verify the restore in isolation, then bring up the selected application image and check `/health/ready`.
- Migrations have no automatic down-migration. Roll back application images only when the old application remains compatible with the new schema; otherwise restore a verified backup or deploy a forward fix.
- Configure monitoring, alerting, log retention, TLS renewal, off-host backups, and an incident/restore owner in the deployment environment. Compose health checks alone are not operational monitoring.

## Release gates not supplied by this repository

- Domain ownership, TLS certificates/reverse proxy configuration, firewall rules, and production hosting/database capacity.
- Verified backup scheduling and restore drills, monitoring/alerting, log retention, and operational on-call ownership.
- Production customer-data retention/deletion policy, privacy disclosures, consent/legal review, and a review of existing web token storage and sensitive customer data access.
- A secure initial admin/catalog provisioning procedure. The production Compose file deliberately does not publish PostgreSQL.
- The mobile dependency audit currently reports five high-severity findings in Expo CLI transitive dependencies (`node-forge` and `zod`). The installed Expo SDK is compatible with the current dependency set; the npm registry has no patched `node-forge` release yet. Recheck and clear these advisories with an SDK-compatible upstream update before EAS/store release.
- Runtime-only npm audits pass for backend and frontend. The complete frontend CRA 5 build/test dependency tree still reports 31 findings (18 high), and the native tree reports five high findings; these are in build/CLI dependencies and are not copied into the static web image or native app bundles. Plan migration to maintained toolchains or compatible upstream patches; do not force incompatible major upgrades into a release.
- Real email-provider credentials and sender-domain verification if customer emails/reminders are required; Clerk credentials if Clerk sign-in is enabled.
- Expo/EAS project ownership, Apple/Google developer accounts, signing credentials, store metadata/privacy declarations, and physical-device acceptance tests.
- Existing-database migration preflight and review of any data cleanup it reports. Do not treat the fresh-volume initializer as an upgrade mechanism.
