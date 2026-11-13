# Pack Out State

NC State Homecoming 2026 event site: four events across three days, run by
Colton Palmer. Tickets sold through outside ticketing links.

- Live at https://www.packoutstate.com. The bare domain redirects there (a
  Vercel domain setting), so every full URL in the code uses the `www` address.
- Repo: github.com/White-Haus-Media/packoutstate
- **The event weekend is over (Nov 2026).** The site stays up showing the final
  state. Do not bring back countdowns, date boxes or ticket buttons for the
  past weekend. A future event would get its own dates.

## How it is built

Plain static HTML, CSS and vanilla JavaScript. No framework, no build step, no
package.json. Do not add React, a site generator, Tailwind, npm packages or a
build pipeline without asking.

The only server code is `api/` (Vercel functions, plain Node, no packages).

Fonts: Field Gothic Condensed Bold from Adobe Fonts kit `pfm7vyg` (the mixtape
page loads its own kit `fir6kvv`). Archivo and DSEG7 are self-hosted in
`assets/fonts/`. HQ uses system fonts. Do not add Google Fonts or jsDelivr.

## Layout

```
index.html            home page, self-contained (its own styles and script)
block-party/          event page, Saturday at Killjoy
talley-tapes/         event page, Friday at House of Art
clocked-out/          event page and booking, Friday at District
clocked-out/manage/   private page to change or cancel a booking
mixtape/              Talley Mixtape page, unlinked from headers, still live
hq/                   internal dashboard, password protected
api/                  server code: booking, HQ, mixtape, contact form
css/site.css          shared styles for the event pages only
assets/               video, posters, logos, photos, fonts
supabase/             SQL kept for reference
docs/HISTORY.md       why things are the way they are
```

Other notes: `DESIGN.md` (design direction), `UI-SYSTEM.md` (components),
`CONTENT-TODO.md` (unconfirmed content), `CLOCKED-OUT-BOOKING.md` (booking
decisions). None of these, nor this file, may be served by the live site. They
are listed in `.vercelignore`; a new notes file needs to be covered there too.

## Rules that are easy to break

- **Header CSS lives in three places:** `index.html`, `css/site.css` and
  `mixtape/index.html`. Change all three together. The same goes for the
  body button rule at the end of each.
- The home page does not use `css/site.css`, on purpose, so editing it cannot
  break the event pages.
- Home page event content lives in the `EVENTS` array (and `FIXTURES` for
  schedule items that are not our events) near the top of the script in
  `index.html`. Edit the data, not the markup below it.
- The header is the same black two-row header on every public page: wordmark
  on row 1, links to Clocked Out, Talley Tapes and Block Party on row 2. Header
  links are white and 12px. "State" in the wordmark uses `--red-bright`.
- Every public page carries the three favicon links, and every footer has the
  HQ link and the Instagram follow button.
- The mixtape page and the home page contact form were built separately. Do not
  remove them, their `api/` files or their environment variables when working
  on something else.

## Content rules (from Colton, not up for reinterpretation)

- **No prices on public pages.** Link to the live ticket page instead. HQ may
  show dollar totals because it is private.
- **The House of Art street address stays off the site.** No address in the
  markup, no map link, city and state only in the structured data.
- **No red strips as decoration.** Section labels are plain red text. The red
  bars over faces in the Talley archive photos are part of the photographs.
- Keep type styles per row low: one voice per row.
- Dress code on the Talley page defers to House of Art. Do not invent one.

## Booking safety (Clocked Out)

- **Slots are claimed by the database, not by the page.** A unique index allows
  one booked reservation per slot. Never move that check into JavaScript.
- **All database access goes through the `pos_` functions.** The tables are
  closed and only the server holds the service key.
- **Email never fails a booking.** Mail errors are logged, not shown.

## Preview and publish

Pushing to `main` publishes to packoutstate.com within a minute. Publish only
when Colton asks. Any other branch makes a private preview. Local preview:
`python3 -m http.server 4173`, then http://localhost:4173.

## Project skills

- `booking-system`: Clocked Out reservations, Supabase, Resend, env variables.
- `hq-dashboard`: the HQ look, event colors, ticket counts.
- `event-pages`: how each landing page is organized, venues, video.
