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

Fonts (type system set Nov 2026): two fonts only. Field Gothic Condensed, Bold
700 only, from Adobe Fonts kit `pfm7vyg`, for headlines. Inter, self-hosted in
`assets/fonts/`, for everything else. HQ uses system fonts. Do not add Google
Fonts or jsDelivr.

Type sizes come from tokens in `:root` (`css/site.css`, `index.html`,
`mixtape/index.html`, keep all three in step): `--fs-h` headline 64 (44 on
phones) for every page and section title, `--fs-t` title 36, `--fs-st`
subtitle 24, `--fs-mark` wordmark, then Inter `--fs-lead` 20, `--fs-body` 16,
`--fs-small` 14 and `--fs-label` 12 caps. Inter weights 400, 600, 700 only.
Do not add new sizes; use a token.

## Layout

```
index.html            home page, self-contained (its own styles and script)
block-party/          event page, Saturday at Killjoy
talley-tapes/         event page, Friday at House of Art
clocked-out/          event page and booking, Friday at District
clocked-out/manage/   private page to change or cancel a booking
mixtape/              Talley Mixtape page, unlinked from headers, still live
gallery/              photo and video gallery ("The Yearbook"), reads gallery/manifest.json
hq/                   internal dashboard, password protected
api/                  server code: booking, HQ, mixtape, contact form
css/site.css          shared styles for the event pages only
css/signal-button.css every button on the public pages (Signal Button), loaded last on each page
assets/               video, posters, logos, photos, fonts
supabase/             SQL kept for reference
scripts/gallery/      Mac-only tool that publishes Drive photos/video to R2 (not served)
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
- **Buttons are Signal Buttons** (Nov 2026), set only in `css/signal-button.css`.
  Primary: `.btn--primary`, `.btn--dark`, `.foot__ig`, `.submit` (pill + red
  circle + arrow). Secondary: `.btn--ghost`, `.btn--line` (outline pill). Dark
  and red sections are listed at the top of that file. Do not restyle buttons in
  page CSS.
- The home page does not use `css/site.css`, on purpose, so editing it cannot
  break the event pages.
- Home page event content lives in the `EVENTS` array (and `FIXTURES` for
  schedule items that are not our events) near the top of the script in
  `index.html`. Edit the data, not the markup below it.
- The header is the same black two-row header on every public page: wordmark
  on row 1, links to Clocked Out, Talley Tapes, Block Party and Gallery on row 2. Header
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

## Gallery

- Photos and video live in the private Cloudflare R2 bucket
  `packoutstate-gallery`, never in the repo. The page loads them through
  `api/gallery-file.js`, which redirects to a signed link.
- To add or change photos: put them in the Drive folder "Pack Out State
  Gallery" (one folder per event, "MM.DD Event - Venue - YYYY"), list it in
  `scripts/gallery/albums.json`, then run
  `python3 -I scripts/gallery/publish.py`. It uploads only what changed and
  rewrites `gallery/manifest.json`, which then gets committed.
- Every file name carries a fingerprint, so a changed photo gets a new name
  and nobody sees a cached old copy. `--prune` removes unused old files.
- Keys: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET in
  `.env.local` and in Vercel. Local preview with the gallery working:
  `node scripts/gallery/devserver.js`, then http://localhost:4174/gallery/.

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

Build tier: 1 (public website). Use the interaction-polish-patterns skill for builds and reviews.
