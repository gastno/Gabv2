# Booking API Contract

All local calendar dates and recurring schedules use `Europe/Reykjavik`. Appointment timestamps in requests must be ISO 8601 with an explicit UTC offset. Responses serialize PostgreSQL timestamps as UTC ISO strings ending in `Z`.

## Availability

`GET /api/appointments/availability?service_id=<id>&date=YYYY-MM-DD&staff_id=<optional-id>` is public. The date is an Iceland-local date. It returns `{ "time_zone": "Europe/Reykjavik", "slots": [...] }`; each slot contains `staff_id`, `staff_name`, `brand_id`, `start_time`, and `end_time`. Slots are generated on a 15-minute grid from an eligible staff schedule and exclude unavailable periods and pending/confirmed appointments.

## Create Booking

`POST /api/appointments` requires `brand_id`, `service_id`, `staff_id`, `start_time`, and `consent_privacy: true`.

Guest requests also require `full_name`, `phone_number`, and a 10-digit `kennitala` (hyphen optional). The server normalizes the Kennitala and reuses its guest profile. If that identity is registered, the request must use the customer token instead. Registration cannot claim an existing guest profile until an ownership-verification flow is implemented; this prevents transferring guest appointments using Kennitala alone.

Registered customer requests send `Authorization: Bearer <customer-token>` and do not need guest identity fields. The authenticated customer row is authoritative; client-submitted profile fields are ignored. Privacy consent remains required.

Client-supplied `duration_minutes` and `price_isk` are ignored. The server derives brand, duration, price, staff eligibility, and schedule availability from PostgreSQL. Successful creation returns `201` with the appointment; invalid contracts return `400`, invalid service/staff selections `422`, and unavailable/overlapping times or registered-identity conflicts `409`.

## Read And Update

Authenticated `GET /api/appointments` and `GET /api/appointments/:id` are scoped to the caller. Customers see their own appointments, staff see their assigned appointments, admins must supply a `brand_id` they are assigned through `staff_brands`, and super admins may optionally filter by brand. Responses omit Kennitala and health information.

Staff/admin status changes use `PATCH /api/appointments/:id/status` with `{ "status": "confirmed" | "completed" | "no_show" }`. Allowed transitions are pending to confirmed, then confirmed to completed or no_show. `POST /api/appointments/:id/cancel` cancels pending/confirmed records for the registered customer owner, assigned staff member, or scoped admin; an optional `reason` is limited to 500 characters.

## Staff Availability Management

Staff tokens use `GET /api/staff-availability/me/availability/YYYY-MM-DD` to read their hours and one-off unavailability for that Iceland-local date. `PUT /api/staff-availability/me/availability/YYYY-MM-DD` replaces only that date's shifts with `{ "shifts": [{ "start_time": "09:00", "end_time": "17:00", "is_active": true }] }`. Shifts are same-day and cannot overlap; an empty array clears only the selected date. Hours never repeat on other dates.

Staff add one-off blocks with `POST /api/staff-availability/me/unavailabilities` using explicit-offset `start_time`, `end_time`, and optional `reason`, and remove them with `DELETE /api/staff-availability/me/unavailabilities/:id`. Blocks overlapping an existing pending/confirmed appointment are rejected.

Admins read a staff member's date-specific hours and unavailability with `GET /api/staff-availability/:staffId?brand_id=<assigned-brand>&date=YYYY-MM-DD`. Admin access is checked against `staff_brands`; super admins may omit the brand filter. These availability-management endpoints are now available for frontend integration.