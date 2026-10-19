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

## Brand Studio Images and Portfolio Layouts

Apply `migrations/004_brand_portfolio.sql` to existing databases before deploying the studio image and portfolio APIs. It adds optional brand logo/cover image URLs, a selected gallery layout, and ordered portfolio images. The migration is additive and can be rerun safely. For fresh databases, `init.sql` includes the same schema.

Public clients can fetch `GET /api/brands/:id/portfolio`, which returns `{ brand_id, layout, available_layouts, images }`. Image records contain `id`, `image_url`, and `display_order`. Layout IDs are `grid`, `masonry`, `mosaic`, `feature`, and `carousel`; extend both the API layout list and the database check constraint when adding presets.

Brand admins with that brand assigned in `staff_brands`, and super admins, can upload multipart `image` files to `POST /api/brands/:id/logo`, `POST /api/brands/:id/cover`, or `POST /api/brands/:id/portfolio/images`; supported formats are JPEG, PNG, and WebP, up to 5 MB. They can remove gallery images with `DELETE /api/brands/:id/portfolio/images/:imageId` and set the layout/order with `PUT /api/brands/:id/portfolio` using `{ "layout": "masonry", "image_ids": [12, 8] }`. The ID list must include every current image for that brand exactly once. Upload responses return the saved URL; gallery URLs are served under `/uploads/brands/`.

The studio frontend must read `logo_url`, `cover_image_url`, and `gallery_layout` from `GET /api/brands`; fetch gallery contents from the portfolio endpoint; render the selected preset; and expose the protected upload, delete, and reorder calls in its admin UI. Existing hard-coded image paths remain frontend fallback values until that consumer is updated.

## Date-Specific Staff Availability

Apply `migrations/002_date_specific_staff_availability.sql` before deploying the date-specific availability API. It creates `staff_availabilities`, whose rows belong to one calendar date and contain a same-day start/end time. `staff_schedules` is left intact as legacy data and is no longer read by the backend; weekly rows are not expanded into dates because that would invent availability. Back up first and apply with the same Docker Compose procedure above, substituting the `002` migration filename.