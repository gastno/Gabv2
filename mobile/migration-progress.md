# Gabv2 Web-to-Native Migration

## Scope

The deployed Express/PostgreSQL backend remains the source of truth. The mobile client uses the same `/api` contract as the web app. Only customer-facing routes are in this app's scope; staff and owner/admin workspaces remain web workflows.

## Worklist

### Nativize now

- [x] Explore: load active brand and service catalog from the live API.
- [x] Booking: choose a Reykjavík-local date and server-returned staff/time slot, submit a guest or signed-in booking, and show API conflicts/errors.
- [x] Customer account: sign in/register, persist the Gabv2 JWT in SecureStore, load upcoming customer appointments, and sign out.

### Nativize later

- [ ] Appointment details, cancellation and previous appointment history.
- [ ] Native customer notification preferences and notification history.
- [ ] Reference-image attachment in the booking flow.
- [ ] Brand portfolio browsing and richer service discovery.
- [ ] Native support for the privacy/cookie preference screens.

### Web-only

- Staff portal and owner/admin catalog, staff, calendar, and ledger tools are not part of this customer app.

## Known migration constraints

- Clerk's current customer sign-in integration is browser-oriented. The first native release uses the existing customer email/password API and SecureStore; federation with Clerk Native SDK needs a separate supported integration and provider setup.
- API host, HTTPS certificate, and customer account endpoints must be available to the device.
- Expo project ownership and store signing credentials are external prerequisites for downloadable store builds.
