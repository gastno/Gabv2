# Gabv2 Mobile

Gabv2 Mobile is an Expo Router application for Android and iOS. It consumes the existing Express API; it does not connect to PostgreSQL directly and does not replace the web app.

## Features

- Live Gabbablu and Amor Tattoo service catalog from `GET /api/brands` and `GET /api/services`.
- Date and staff-specific time selection from the public availability endpoint. Dates use `Europe/Reykjavik`.
- Guest booking with privacy/cancellation acceptance and server-side validation; authenticated customer booking is also supported.
- Customer sign-in, registration, secure token storage, upcoming appointment history, and sign-out.
- Platform-native navigation and native Expo UI buttons/consent controls.

## Local development

Copy `.env.example` to `.env.local` and set `EXPO_PUBLIC_API_URL` to the backend API URL ending in `/api`. This variable is public and compiled into the JavaScript bundle; never put credentials in it.

For a local API:

- Android emulator: `http://10.0.2.2:5000/api`
- iOS simulator: `http://localhost:5000/api`
- Physical device: use the development machine's LAN address and allow device-to-host traffic.

The API must be reachable from the device. Production builds must use an HTTPS API URL. Start Expo from this directory with `npm start`; use `npm run android` or `npm run ios` to open a configured local simulator. iOS simulator and native iOS builds require macOS/Xcode. EAS can build store artifacts in the cloud after the project is linked to an Expo account and credentials are configured.

## Validation

```sh
npm test
npm run typecheck
npm run doctor
npm run export
```

`npm run export` bundles Android and iOS JavaScript; it is not a substitute for running the app on physical devices/simulators or signing store binaries.

## Release prerequisites

- Configure the production API URL and HTTPS/TLS, CORS, rate limits, monitoring, and customer support operations.
- Recheck and resolve the current high-severity Expo CLI dependency audit advisories with an SDK-compatible upstream update before store release.
- Link this app to the organization's Expo/EAS project and set Android/iOS signing credentials, store listings, privacy disclosures, and age/content declarations.
- Test booking, authentication, keyboard behavior, accessibility, and back navigation on supported physical iOS and Android devices.
- Confirm the published privacy policy, booking/cancellation terms, and data retention requirements for customer identity details.
- The web staff/admin workspaces are intentionally out of scope for this customer mobile app.
