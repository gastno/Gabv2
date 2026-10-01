# Gabv2 Agent Guide

## Product and Architecture

Gabv2 is a multi-brand booking system for the Gabbablu beauty studio and Amor Tattoo. Its intended users are brand owners/admins, staff, and customers.

- `frontend/src/pages/Admin/` contains the owner/admin workspace. Catalog and staff management call the API; the calendar and ledger currently use local demo data.
- `frontend/src/pages/Staff/` and `StaffLogin/` contain the staff portal. Login calls the API, but appointments and working-hour changes in the dashboard are currently in-memory demo behavior.
- `frontend/src/pages/Home/` and `Gabbablu/` contain the customer-facing pages. The home page links to both brands, but only Gabbablu has a route/page; its catalog, team, availability and booking confirmation are hard-coded/demo behavior.
- `frontend/src/services/api.js` is the shared fetch/API client. Reuse it for frontend requests and keep multipart uploads consistent with its existing upload methods.
- `backend/src/routes/` maps Express endpoints to `controllers/`; `middleware/` owns authentication, role checks and upload filtering. Backend modules use CommonJS.
- `backend/src/config/db.js` wraps the PostgreSQL pool. Use parameterized SQL through `db.query`; keep database access in controllers.
- `database/init.sql` defines the PostgreSQL schema, including catalog, staff assignments, appointments, recurring schedules and one-off unavailabilities. `database/seed_db.py` seeds roles, brands and an initial admin.
- `uploads/` holds processed media served by the backend. Frontend assets and brand portfolios live in `frontend/public/`.

The frontend README is the standard Create React App guide, not a product specification. There is no backend test suite yet; the current frontend test is still the Create React App starter test.

## Development Commands

Run commands from the indicated directory:

- Database: `docker compose up -d postgres_db` from the repository root.
- Backend: `npm run dev` in `backend/` (or `npm start`). Configure database/JWT values in `backend/.env`; do not commit or expose secrets.
- Frontend: `npm start` in `frontend/`; set `REACT_APP_API_URL` in `frontend/.env` when the API is not at its default local URL.
- Frontend production build: `npm run build` in `frontend/`.
- Frontend tests: `npm test -- --watchAll=false` in `frontend/`. Replace the starter test with behavior-focused tests as features are implemented.
- Seed a local database: install `database/requirements.txt`, then run `python database/seed_db.py` from the repository root. The Compose database initialization script runs only when PostgreSQL initializes an empty data volume; avoid deleting that volume unless its data can be discarded.
- `npm test` in `backend/` is a placeholder that exits with an error; do not report it as a functioning test suite.

## Current Gaps and Development Roadmap

Treat these as a working backlog, not claims that a feature is already implemented. Update this list as work lands.

### 1. Make booking and availability correct

- [ ] Add authenticated staff self-service endpoints for recurring working hours and one-off unavailable periods, using `staff_schedules` and `staff_unavailabilities`.
- [ ] Add a public availability query that combines a staff member's assigned services, schedule, unavailability and existing appointments; account for service duration and define one explicit studio timezone.
- [ ] Harden appointment creation: validate required input and consent, confirm the service belongs to the selected brand and is assigned to the selected staff member, and load authoritative price/duration from the database rather than trusting client values.
- [ ] Prevent overlapping bookings under concurrent requests with a database-backed transaction/constraint strategy; return clear conflicts instead of generic server errors.
- [ ] Add scoped appointment read, update/status and cancellation operations for customer, staff and admin workflows. Enforce ownership, assigned-brand and role checks on the server, not only in React.
- [ ] Add backend tests for authorization, invalid bookings, availability, overlap races, status transitions and guest/registered customer behavior.

### 2. Connect the staff and owner workspaces

- [ ] Replace the staff dashboard's sample appointments and local-only edits with the scoped appointment APIs; show the staff member's real ledger and calendar.
- [ ] Persist staff availability through the new schedule APIs and show unavailable periods distinctly from open appointment slots.
- [ ] Replace admin calendar/ledger demo data with brand-filtered API data, real date navigation and persisted status actions.
- [ ] Check brand scoping throughout admin mutations: current role middleware distinguishes role but does not itself enforce which brand an admin may manage.

### 3. Complete customer discovery and booking

- [ ] Build the missing Amor Tattoo route/page and make brand pages load brand, category, service and eligible staff data from the API instead of embedded arrays.
- [ ] Drive booking dates and time slots from the availability API, submit bookings to the backend, and handle loading, validation, conflicts and success states.
- [ ] Add customer registration/login UI and session handling; connect registered identity/profile data to bookings and allow customer appointment history and cancellation.
- [ ] Decide and implement customer notifications (confirmation, reminder, cancellation), including provider/configuration and failure handling; no notification delivery is present yet.

### 4. Add production readiness

- [ ] Replace the starter test with frontend workflow coverage and add backend test infrastructure; include database-backed integration coverage for critical booking paths.
- [ ] Validate request schemas and consistent error responses, review authentication/token storage and customer sensitive-data handling, and move development credentials out of tracked defaults.
- [ ] Make schema changes repeatable for existing databases (migrations or a documented migration process); `init.sql` alone only initializes a fresh Compose volume.
- [ ] Document deployment configuration, backups, logging and operational recovery before using real customer data.

## Working Practices

- Make changes in the owning layer: route registration in `backend/src/routes/`, behavior in controllers, shared transport in `frontend/src/services/api.js`, and UI in the relevant page/tab/component.
- Preserve existing React/CSS and CommonJS conventions unless a scoped change requires otherwise. Keep API field naming aligned with the existing PostgreSQL schema or translate at a clear boundary.
- Protect every private API operation with server-side authentication and authorization. Public catalog/availability reads must not expose customer or staff-private data.
- Treat submitted prices, durations, staff IDs, brand IDs and roles as untrusted input. Validate relationships and derive authoritative values server-side.
- Add or update focused tests for behavior changes. Do not mistake mock UI state or the starter test for a completed end-to-end workflow.
