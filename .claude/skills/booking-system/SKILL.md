---
name: booking-system
description: The Clocked Out reservation system on packoutstate (Supabase schema, pos_ functions, Resend email, api/ functions, environment variables). Use when changing or debugging bookings, slots, the manage page, booking emails or this project's Vercel environment variables.
---

# Clocked Out booking system

Clocked Out takes reservations, so that one page has a server and a database.
The rest of the site is static files. `CLOCKED-OUT-BOOKING.md` holds the
decisions behind the page; read it before changing behaviour.

## Pieces

- **Database:** Supabase project `studio-ops`, in its own `packoutstate` schema
  so it cannot collide with anything else there. Tables: slots, reservations,
  creators, plus `ticket_counts` for HQ.
- **Server:** the files in `api/`, running on Vercel. Plain Node with no npm
  packages, so there is still no build step. `_lib.js` holds the shared
  helpers; `slots.js`, `reserve.js`, `manage.js` and `creator.js` serve the
  booking pages; `hq.js` serves the dashboard.
- **Email:** Resend, sending from hello@mail.packoutstate.com, the domain
  verified on the account. Replies go to info@dccsocial.com. dccsocial.com is
  not verified in Resend, so do not set the from address to it without doing
  the DNS work first.

## Rules

- **Slots are claimed by the database.** A partial unique index allows exactly
  one booked reservation per slot. Two people tapping the same time in the
  same second cannot both win; one is told to pick again. Never move that
  check into JavaScript.
- **All access goes through the `pos_` functions.** The tables are closed. The
  functions run with the service key, which only the server has.
- **Email never fails a booking.** If Resend is down the reservation is still
  saved and the person still sees the confirmation on screen. Mail errors are
  logged.

## Environment variables (set in Vercel, never in code)

Booking and HQ: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`,
`HQ_PASSWORD`, `TEAM_EMAIL`, `MAIL_FROM`.

Mixtape and contact form (older, leave alone): `TURNSTILE_SECRET_KEY`,
`CLIENT_ID`, `FROM_EMAIL`, `NOTIFY_EMAIL`, `SITE_NAME`. The contact form
follows the shared pipeline in the `site-forms` skill.

## Sending email by hand

Claude cannot send one-off email for this project unattended; the permission
checks block pulling the Resend key locally. Build tap-to-send links for Colton
instead, or ask him to grant the permission for that one job.
