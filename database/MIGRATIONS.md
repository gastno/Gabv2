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

## English and Icelandic Staff and Catalog Content

Apply `migrations/005_localized_catalog_content.sql` to existing databases before deploying the localized staff/category/service API. Back up the database first and apply it with the Docker Compose procedure above, substituting the `005` migration filename. The migration renames each legacy `description`/`name` column to its `_en` counterpart so existing English content is retained, and adds nullable `_is` columns for Icelandic text. It is safe to rerun. New installations get the same schema from `init.sql`; the seed script writes the staff description to `description_en`.

Staff records expose `description_en` and `description_is`; categories and services expose `name_en`, `name_is`, `description_en`, and `description_is`. English-only aliases (`description`, and for categories `name`, `title`, and `subtitle`) remain in API responses for existing clients. Legacy create/update input fields are still accepted as English content. The frontend should select the `_en` or `_is` value based on the chosen language and handle null Icelandic content until translations are entered.

## English and Icelandic Brand Descriptions

Apply `migrations/006_localized_brand_descriptions.sql` to existing databases before deploying the localized brand API. Back up first and use the Docker Compose migration procedure above, substituting the `006` migration filename. It adds nullable `description_en` and `description_is` columns and copies existing `about_description` values to `description_en` without overwriting existing translations. Fresh databases receive the same columns through `init.sql`.

`GET /api/brands` returns both locale fields and retains the `about_description` English alias for older clients. `PUT /api/brands/:id` accepts either or both locale fields; the legacy `about_description` input remains supported as English content and is kept synchronized with `description_en`. Brand mutation access remains restricted to super admins and admins assigned to that brand.

## Appointment Reference Images

Apply `migrations/007_appointment_reference_images.sql` to existing databases before deploying appointment reference uploads. Back up first and use the Docker Compose migration procedure above, substituting the `007` migration filename. Fresh databases receive the same table from `init.sql`.

Customers may submit an optional multipart booking with up to five `reference_images` files (JPEG, PNG, or WebP; maximum 5 MB per file), alongside the normal booking fields. The images are validated, resized, stripped of metadata, and stored in PostgreSQL. Appointment list/detail responses include `reference_images` entries with an `id` and protected `url`; fetch the URL with an authenticated request. Only the appointment's customer, assigned staff member, or an admin authorized for its brand can retrieve the image. The frontend must switch the booking request to multipart when images are attached and fetch/display each protected image using its auth token.

## Clerk Customer Sign-In

Apply `migrations/008_clerk_customer_identities.sql` to existing databases before deploying Clerk sign-in. Back up first and run:

```powershell
Get-Content -Raw database/migrations/008_clerk_customer_identities.sql | docker compose exec -T postgres_db psql -U $env:POSTGRES_USER -d $env:POSTGRES_DB
```

Use the deployment's actual PostgreSQL credentials; this migration is not run during backend tests. Fresh databases receive the same identity table from `init.sql`. The table stores only the provider (`clerk`), stable Clerk user subject, and customer foreign key; it does not store Clerk session tokens, access tokens, or secrets.

Configure these backend environment variables without committing them:

- `CLERK_SECRET_KEY`: secret key for the Clerk instance; the backend uses it for SDK token verification and authoritative user lookup.
- `CLERK_ISSUER`: exact issuer URL shown in the verified Clerk session token's `iss` claim (for example, the instance's Clerk domain). It is enforced during verification.
- `CLERK_AUTHORIZED_PARTIES`: comma-separated list of exact frontend origins allowed to mint the session tokens, such as `http://localhost:3000` and the production frontend origin.

The frontend should obtain a Clerk session token and send it as `Authorization: Bearer <token>` to `POST /api/auth/customer/clerk/session`. A mapped identity returns `{ "status": "authenticated", "token": "<Gabv2 JWT>", "customer": { "id": 1, "full_name": "...", "email": "..." } }`; an unmapped identity returns `{ "status": "profile_required", "profile": { "full_name": "...", "email": "..." } }`. For the latter, collect `full_name`, `phone_number`, and `kennitala`, then send them with the same Bearer token to `POST /api/auth/customer/clerk/complete-profile`. Success returns the authenticated shape. Treat browser-supplied `full_name` as new profile input only; the backend takes the identity subject and verified email from Clerk and ignores client-supplied email, role, or customer ID. Missing/invalid profile fields return HTTP 400, invalid/unverified sessions return HTTP 401, unavailable Clerk verification returns HTTP 503, and profile conflicts return HTTP 409 with a generic message that does not identify whether the email or Kennitala is already in use. The backend never links an existing customer or guest profile by matching email or Kennitala.

## Promotional Pricing and Appointment Notifications

Apply `migrations/009_promotional_pricing_notifications.sql` to an existing database before deploying promotional pricing or notification features. Back up first, then apply using the migration procedure above with the `009` filename. It is additive and safe to rerun. Fresh databases receive the same columns and tables through `init.sql`.

```powershell
Get-Content -Raw database/migrations/009_promotional_pricing_notifications.sql | docker compose exec -T postgres_db psql -U $env:POSTGRES_USER -d $env:POSTGRES_DB
```

Service `sale_price_isk` is nullable and must be non-negative and lower than the regular `price_isk`. Public service reads omit inactive services; authenticated staff and admins can read inactive entries for administration. Booking always reads current prices from PostgreSQL, rejects inactive services, and snapshots the sale price when set (otherwise the regular price) into the existing `appointments.price_snapshot_isk`.

Registered customers can change their email-notification preference and read their own notification history with the authenticated customer API. Email is opt-in and requires a verified deployment/provider configuration. Configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in the backend environment; never place the key in source control. The worker uses Resend's email API and an event-specific idempotency key, records provider errors, and retries transient delivery failures a bounded number of times. If delivery configuration is missing, queued events are marked failed rather than reported as sent.

Appointment status-transition events are inserted in the same database transaction as the successful status change. A scheduled worker scans upcoming appointments and inserts a single 24-hour reminder event per appointment; database uniqueness and row locking make scans safe across multiple API processes. Run the worker as part of the backend process after applying the migration. Delivery is asynchronous; the customer notification history reports queued, sent, failed, or skipped state.

Apply `migrations/010_notification_read_state.sql` to add customer read state to existing notification outbox rows. It is additive and safe to rerun; existing rows start unread. Fresh databases include `is_read` and its unread-customer index in `init.sql`.

```powershell
Get-Content -Raw database/migrations/010_notification_read_state.sql | docker compose exec -T postgres_db psql -U $env:POSTGRES_USER -d $env:POSTGRES_DB
```

`GET /api/notifications` returns the authenticated customer's notification rows with `is_read` and an `unread_count`. `PATCH /api/customers/notifications/read` accepts either `{ "notification_ids": [12, 13] }` (1–100 IDs) or `{ "all": true }`; updates are always scoped to the authenticated customer. `GET /api/appointments?period=previous` returns only that customer's appointments whose end time is in the past, newest first; `period=upcoming` returns pending/confirmed appointments that have not ended. Other values of `period` are rejected, and staff cannot use these customer filters.