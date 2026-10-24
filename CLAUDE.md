# Pack Out State

NC State Homecoming 2026 event site. Four events across three days, run by
Colton Palmer. The site sells tickets through outside ticketing links.

Live at packoutstate.com. Repo: github.com/White-Haus-Media/packoutstate.
The site's real address is https://www.packoutstate.com. The bare domain
redirects there (a Vercel domain setting). Every full URL in the code, such as
canonical tags, share images, structured data, calendar exports and booking
emails, uses the www address so nobody goes through the redirect.
Local copy: ~/Projects/clients/packoutstate (the only one, see below).

## What it is built with

Plain static HTML, CSS and vanilla JavaScript. No framework, no build step,
no package.json, no dependencies. Open a file, edit it, done.

Do not introduce React, a static site generator, Tailwind, npm packages or a
build pipeline without asking first.

Display font is Field Gothic Condensed Bold, loaded from Colton's Adobe Fonts
web kit `pfm7vyg` (approved by Colton Oct 2026, replacing Anton). The mixtape
page also loads its own kit `fir6kvv`. HQ uses plain system fonts.

Adobe Fonts stays on Adobe's servers, because its license does not allow
self-hosting. Everything else is self-hosted in `assets/fonts/` (Oct 2026,
for speed), with the SIL OFL license files beside them:
- Archivo for body text. One variable file per character set covers weights
  400 to 800. Each public page declares it in a small `<style>` block in the
  `<head>` and preloads `archivo-latin.woff2`.
- DSEG7 Classic Bold for the home page countdown digits only.
Do not add Google Fonts or jsDelivr links back. A new weight of Archivo
needs no new file; a new font family gets its own files in `assets/fonts/`.

## Layout of the folder

```
index.html            home page, fully self-contained (its own styles and script)
block-party/          event landing page, Saturday at Killjoy
talley-tapes/         event landing page, Friday at House of Art
clocked-out/          event landing page and booking, Friday at District
clocked-out/manage/   private page for changing or cancelling a booking
hq/                   internal list, password protected
api/                  the only server code on the site, see below
css/site.css          shared foundation used by the event pages only
assets/               hero video, posters, venue logos, photo albums
flyer-*.jpg           event flyers
CONTENT-TODO.md       running list of anything unconfirmed
CLOCKED-OUT-BOOKING.md  decisions behind the booking page
DESIGN.md             design direction
UI-SYSTEM.md          component reference
```

The home page does not use css/site.css. It keeps its own styles inline, on
purpose, so editing it cannot break the event pages.

## Home page content

The hero text (`[data-animate]`) starts hidden and fades in as soon as the
page markup is ready (DOMContentLoaded). It used to wait for the window
`load` event, which held it back until every image, font and the contact
form widget had loaded, about 6 seconds on a phone. Keep it off `load`.

All event content lives in an `EVENTS` array near the top of the `<script>`
in index.html, along with `EVENT_START` and `EVENT_END` for the countdown.
Edit those, not the markup below them.

Give an event a `pageUrl` and its card automatically links to that landing
page instead of the outside details link.

## Header and footer

Every public page (home, the three event pages, the Clocked Out manage page,
the mixtape page) carries the same two-row header, set in Oct 2026:
- Row 1: the Pack Out State wordmark ("State" in red), the Thu, Fri and Sat
  date boxes, and a red button on the right. The button is per page: Get
  tickets, or Reserve a time on Clocked Out, none on the manage page. Below
  660px wide there is no room, so the button is hidden and each page's hero
  button carries it.
- Row 2: links to Clocked Out, Talley Tapes, Block Party and Mixtape, shown
  at every width, the current page underlined.
All header text (date boxes, page links, button) is white and 12px on every
page; only the wordmark is larger. Colton set this, so do not grey it back.
On the home page the date boxes scroll to that day. Everywhere else they link
to `/#day-thu` and so on, and the home page script jumps there once the day
sections are drawn.
The header CSS lives in three places, because the home page and the mixtape
page keep their own styles: `index.html`, `css/site.css`, `mixtape/index.html`.
Change all three together.

**The Mixtape link is gone from row 2.** Removed Oct 22 2026 at Colton's
request, from all six headers: index.html, the three event pages,
clocked-out/manage and mixtape itself. Row 2 is now Clocked Out, Talley
Tapes, Block Party.
The plan had been to drop it after submissions closed (Sunday, Oct 25,
11:59 PM), so this went three days early. The `/mixtape` page itself is
untouched and still live at its own URL, it is only unlinked from the
headers. Putting the link back is one line per page if that was not the
intent.

"State" in the wordmark uses `--red-bright` (#FF3B30) on all three header
copies. Plain `--red` (#CC0000) is too dark to read on the near-black header.

Every public page links the favicon: a white S on a solid #CC0000 square,
`favicon.ico`, `favicon.svg` and `apple-touch-icon.png` at the site root.
A new public page needs the same three `<link>` tags.

Every footer has an HQ link (`/hq`, nofollow) so partners can reach the
dashboard from the site.
Every footer also has a "Follow us @packoutstate" Instagram button
(instagram.com/packoutstate).

Buttons in the page body (`.btn`, and `.submit` on the mixtape page) use body
text size (1.05rem, 16.8px), normal case, bold, 44px tall. Colton found the
old capitals-and-padding buttons too bulky (Oct 2026). The rule sits at the
end of `index.html`, `css/site.css` and the mixtape page so it wins; keep the
three in step. The header button is separate and stays 12px.

## Event landing pages

Not every event gets a page. A page is worth building when someone needs to
gather something before they go: a schedule, policies, a booking step. A
free RSVP with one venue and one time does not need a page, it needs a good
card on the home page. The Warm Up had a page built and removed for exactly
this reason.

Each page has its own organising principle and its own layout. Do not build
a shared template and stamp it out.

- Block Party is organised around TIME. It runs 10.5 hours across a football
  game, so the real question is when to come and how it works around
  kickoff. It has a timeline, the wristband re-entry rule, an FAQ, and a
  photo grid.
- Talley Tapes is organised around STORY. It is a Homecoming party at House
  of Art, not a documentary screening. Colton's line for it: same people,
  different era, same energy. The one sheet leads, the facts sit directly
  under it, the lore follows, the archive is evidence, and the FAQ sits at
  the end. No timeline, no photo grid.
  The teaser videos were pulled from the page in Oct 2026 and the one sheet
  carries the hero on its own. The cuts are still in assets/ for when they
  go back.
  Dress code on this page defers to House of Art's own policies. Do not
  invent one.

## The booking system

Clocked Out takes reservations, so that one page needs a server and a
database. Everything else on the site is still plain static files.

- **Database:** Supabase project `studio-ops`, in its own `packoutstate`
  schema so it cannot collide with anything else in there. Three tables:
  slots, reservations, creators.
- **Email:** Resend, sending from hello@mail.packoutstate.com, which is
  the domain already verified on the account. Replies go to
  info@dccsocial.com. dccsocial.com itself is not verified in Resend, so do
  not set the from address to it without doing the DNS work first.
- **Server:** four files in `api/`, running on Vercel. Plain Node with no
  npm packages, so there is still no build step and no package.json.

**Slots are claimed by the database, not by the page.** A partial unique
index allows exactly one booked reservation per slot, so two people tapping
the same time in the same second cannot both win. One gets it, the other is
told to pick again. Never move that check into JavaScript.

**All database access goes through the `pos_` functions** in Supabase. The
tables themselves are closed. The functions run with the service key, which
only the server has.

**Environment variables**, all set in Vercel, never in the code:
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`,
`HQ_PASSWORD`, `TEAM_EMAIL`, `MAIL_FROM`.

The project also carries older variables from the mixtape and contact form
work: `TURNSTILE_SECRET_KEY`, `CLIENT_ID`, `FROM_EMAIL`, `NOTIFY_EMAIL`,
`SITE_NAME`. Leave them alone, they belong to those features.

**Email never fails a booking.** If Resend is down, the reservation is still
saved and the person still sees their confirmation on screen. Mail errors
are logged, not shown as a failed booking.

## Content rules

These came from Colton and are not up for reinterpretation.

- **No prices anywhere.** Pricing changes, so pages link to the live ticket
  page instead of printing a number that can go stale. The pattern is
  "Tickets on sale now" plus the link.
- **No em dashes in any page copy.** Rewrite as commas or full stops. Do not
  swap in another symbol.
- **Kickoff is 12:00 PM ET**, announced Oct 2026. NC State vs California at
  Carter-Finley. It was TBA for most of the build, so if you find "Kickoff
  TBA", "Until kickoff" or "Time TBA" anywhere, it is stale, fix it.
  The Block Party doors moved to 12:00 PM at the same time, so doors and
  kickoff are the same moment. There is no tailgate window before the game.
  The run of show opens as a watch party, the lot runs through the game, and
  the block fills back up from around 3:30. Do not reinstate a pre-game
  tailgate row; it would describe a window that does not exist.
  The `FIXTURES` array near the top of the script in index.html holds
  schedule entries that are not our ticketed events, such as the game
  itself. They show in the weekend overview only, never as an event card,
  and they lead their day.
- **The House of Art street address stays off the site.** The venue name is
  announced, the address is not. There is no address in the markup, no map
  link, and the structured data carries city and state only. When it is
  cleared, four places need it: the venue card, the Address row, the
  PostalAddress in the JSON-LD, and the `where` field used by the calendar
  export. A directions link can go back at the same time.
- **No red strips as decoration.** Red label chips and redaction bars were
  removed. Section labels are plain red text. The red bars over faces in the
  Talley archive photos are burned into the original photographs and stay.
- Keep the number of type styles per row low. One voice per row, not a
  different font and size on every line.

## Venues

Each venue ships two logo files, white and black. Pick the one that suits the
background of the section it sits in. The site does not switch themes at
runtime, so this is a per-placement choice, not a runtime swap.

Venue logos link to the venue's own site. Killjoy links to
killjoycocktail.com. House of Art is deliberately not linked, because their
site has no venue information on it yet.

## Video and images

ffmpeg is installed for the user only, through pip, and is not on PATH:

```bash
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
```

Hero loops are silent, roughly 7 to 10 seconds, 1280 wide, encoded to both
MP4 (H.264, universal) and WebM (VP9, smaller, preferred by Chrome and
Firefox), with a poster JPG. The exact commands are in README.md.

Pages load hero video only on screens 768px and wider, never when the
visitor has data saver on or prefers reduced motion. The poster carries it
otherwise. Check again on resize, because a tab that has not been laid out
yet reports a zero width viewport.

Talley Tapes ships two teaser cuts, 16:9 and 9:16. The page picks by
viewport, and will not swap the file out from under someone already
watching. Both start at 2.7 seconds, which trims a Netflix style intro out
of the web versions. The full masters are untouched in the assets folder.

Raw camera files and full resolution photos do not belong in the repo. Put
optimised derivatives in assets/ and keep originals elsewhere.

## One working copy

There used to be two clones of this repo, one in Downloads and one in
Documents/GitHub. Work happened in both and they drifted a month apart, which
nearly wiped the mixtape page off the live site during a deploy. There is now
one copy, at ~/Projects/clients/packoutstate. Keep it that way, and push to
GitHub at the end of a session rather than letting a local copy run ahead.

## Previewing and publishing

Preview, which nobody else can see:

```bash
npx vercel@latest deploy --scope colton-palmers-projects
```

Publish to packoutstate.com. Colton runs this, Claude is not permitted to:

```bash
npx vercel@latest deploy --prod --scope colton-palmers-projects
```

**Pushing to `main` on GitHub also publishes to packoutstate.com.** The Vercel
project is connected to the repo, so every push to main goes live within a
minute, with no separate deploy step (confirmed Oct 24 2026). Treat a push to
main exactly like the publish command above: only when Colton asks for it.
Pushing any other branch makes a private preview, never a live change.

There is also a local preview at http://localhost:4173 using
`python3 -m http.server 4173`. The event pages use root absolute paths, so
opening the files directly with file:// will not load the CSS.

## HQ, the internal dashboard

`/hq` is one password (`HQ_PASSWORD`) for the whole team, who see every
name, email and phone number on it. Colton approved that in Oct 2026. It has
four tabs: Overview, Tickets, Clocked Out, Mixtape.

Look: the "Clean Ops" direction Colton picked in Oct 2026 out of four
mockups. White cards on a light grey ground, system fonts, no dark
background. It is standalone and does not load css/site.css. Each event has
one fixed color, used on every chart, table dot and card edge for that
event: Warm Up `#B07818`, Talley Tapes `#C8102E`, Clocked Out `#2E6BD1`,
Block Party `#14967C`. That set was checked together for colorblind
separation; change one and re-check the set. Charts are hand-drawn SVG in
the page script, no chart library. The sales line needs two readings before
it draws.

`api/hq.js` checks the password, then calls `pos_hq` (bookings) and
`pos_hq_mixtape` (mixtape results) side by side. If one fails the other still
shows. `pos_hq_mixtape` is read only and its SQL is in
`supabase/hq-mixtape.sql`.

Ticket sales come from OasisTix (VenuePilot underneath). Colton's OasisTix
login cannot create API keys and has no Ticket Counts share link, and
VenuePilot's public API has no sales data. So readings land in
`packoutstate.ticket_counts` two ways, both through `pos_tickets_record`:
- A scheduled Claude task, `pos-ticket-sync` (9am, 1pm, 5pm, 9pm), reads the
  OasisTix events list in Colton's Chrome and saves the numbers. It needs the
  Mac on, the Claude app open, and Chrome logged in to OasisTix. It never logs
  in itself.
- The "Update counts by hand" form on HQ, as a backup.
HQ shows the latest reading per event (`pos_hq_tickets`), when it was taken,
and warns when it is over 12 hours old. Dollar totals show here because HQ is
private; the no-prices rule is for public pages. SQL is in
`supabase/hq-tickets.sql`.

## Other things in this repo

The site also carries a Talley Mixtape page at `/mixtape` and a contact form
on the home page, both built in separate sessions. They use `api/mixtape.js`,
`api/song-search.js`, `api/contact.js` and the `talley_mixtape` schema in the
same Supabase project. Do not remove them when working on event pages.

