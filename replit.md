# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Deferred Integrations (Fade Factory ATL)

The following features are built in `artifacts/api-server` but not yet connected to live credentials:

### SMS Notifications (`artifacts/api-server/src/lib/sms.ts`)
- Uses Twilio SDK. When ready, set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` as secrets.
- Barber phones: `BARBER_AKEEM_PHONE` already set. Add `BARBER_JEFF_PHONE` when provided.
- The Replit Twilio connector (`connector:ccfg_twilio_01K69QJTED9YTJFE2SJ7E4SY08`) is available as an alternative — set `TWILIO_CONNECTION_ID` env var after connecting.

### Google Calendar (`artifacts/api-server/src/lib/googleCalendar.ts`)
- Uses `googleapis` SDK. When ready, provide a Google service account JSON key or connect via the Replit Google Calendar connector (`connector:ccfg_google-calendar_DDDBAC03DE404369B74F32E78D`).
- Set `GOOGLE_CALENDAR_CONNECTION_ID` after connecting, or set `GOOGLE_SERVICE_ACCOUNT_JSON` secret for service-account auth.

### Booking Route (`artifacts/api-server/src/routes/bookings.ts`)
- `POST /api/bookings` — fully implemented, calls both sms.ts and googleCalendar.ts.
- Currently the frontend (Book.tsx) opens a personal Google Calendar link instead of calling this route. Swap back by replacing the `<a href={buildCalendarUrl...}>` CTA with the `confirmBooking()` button once credentials are set.
