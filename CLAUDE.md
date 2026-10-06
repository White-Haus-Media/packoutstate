# Pack Out State

NC State Homecoming 2026 event site. Four events across three days, run by
Colton Palmer. The site sells tickets through outside ticketing links.

Live at packoutstate.com. Repo: github.com/White-Haus-Media/packoutstate.
Local copy: ~/Desktop/Claude/packoutstate (the only one, see below).

## What it is built with

Plain static HTML, CSS and vanilla JavaScript. No framework, no build step,
no package.json, no dependencies. Open a file, edit it, done.

Do not introduce React, a static site generator, Tailwind, npm packages or a
build pipeline without asking first.

Display font is Field Gothic Condensed Bold, loaded from Colton's Adobe Fonts
web kit `pfm7vyg` (approved by Colton Oct 2026, replacing Anton). Archivo for
everything else comes from Google Fonts. The mixtape page also loads its own
kit `fir6kvv`. HQ uses plain system fonts.

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

All event content lives in an `EVENTS` array near the top of the `<script>`
in index.html, along with `EVENT_START` and `EVENT_END` for the countdown.
Edit those, not the markup below them.

Give an event a `pageUrl` and its card automatically links to that landing
page instead of the outside details link.

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
- **No kickoff time, not even an estimate.** The conference has not released
  it. The Block Party says so plainly and the schedule reads "Until kickoff"
  and "Kickoff TBA". When the time is released, four things change: the
  notice at the top of the run of show, the kickoff row, the tailgate row,
  and the `FIXTURES` entry near the top of the script in index.html, which
  currently reads "Time TBA".
  That `FIXTURES` array holds schedule entries that are not our ticketed
  events, such as the game itself. They show in the weekend overview only,
  never as an event card, and they lead their day.
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
one copy, at ~/Desktop/Claude/packoutstate. Keep it that way, and push to
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

There is also a local preview at http://localhost:4173 using
`python3 -m http.server 4173`. The event pages use root absolute paths, so
opening the files directly with file:// will not load the CSS.

## HQ, the internal dashboard

`/hq` is one password (`HQ_PASSWORD`) for the whole team, who see every
name, email and phone number on it. Colton approved that in Oct 2026. It has
three sections: Tickets, Clocked Out, Mixtape.

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

