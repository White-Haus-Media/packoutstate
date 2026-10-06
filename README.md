# Pack Out State — NC State Homecoming 2026

Static site. No build step, no dependencies.

## Structure
```
index.html            the home page (styles + content + logic, self-contained)
block-party/          event landing page — Sat, Killjoy
talley-tapes/         event landing page — Fri, House of Art
css/site.css          shared foundation for the event landing pages
assets/               hero video + poster, venue logos, per-event photo albums
flyer-*.jpg           event flyers
CONTENT-TODO.md       every unconfirmed placeholder, per event
DESIGN.md             design direction
UI-SYSTEM.md          component reference
```

## Updating the home page
Open `index.html` and edit the two labeled zones at the top of the `<script>`:
1. EVENT_START / EVENT_END — countdown dates
2. EVENTS array — the lineup (add/remove/reorder events)

Give an event a `pageUrl` and its card links to that landing page instead
of the outbound details link.

## Event landing pages
Not every event gets one. A page is worth building when a patron actually
needs to gather something before they go — pricing tiers, policies, a
schedule, a booking step. A free RSVP with one venue and one time does not
need a page; it needs a good card on the home page.

Sections are chosen per event rather than stamped from a fixed template,
so no two pages read the same. Each page has its own organising principle:

- **Block Party** — TIME. It runs 10.5 hours across a football game, so
  "when do I come, and how does it work around kickoff?" is the real
  question. Timeline spine, wristband mechanic, FAQ, photo grid.
- **Talley Tapes** — STORY. A Homecoming party at House of Art, not a
  documentary screening. One sheet leads, facts sit under it, lore follows,
  the archive is evidence, FAQ at the end. No timeline, no grid.

Venue logos link to the venue's own site, and ship in two variants — the
black mark on light sections, the white mark on dark. Pick the variant to
suit the section it sits in; the site does not theme-switch at runtime. Shared components live in `css/site.css`;
page-specific styling stays in that page's own `<style>` block.

Values that are not yet confirmed are wrapped in `<span class="draft">`
and flagged with a `<!-- TODO:CONFIRM -->` comment. Each such page carries
a `draft-banner` at the top. **Remove the banner and clear the drafts
before deploying.**

## Hero media
Encoded with ffmpeg (installed user-level via `pip install --user imageio-ffmpeg`):

```
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")

# H.264 fallback, two-pass, ~1.4 MB for 8s at 720p
"$FF" -i source.mov -an -c:v libx264 -preset veryslow -profile:v high \
  -pix_fmt yuv420p -vf scale=1280:-2 -b:v 1400k -maxrate 1800k \
  -bufsize 3000k -g 48 -movflags +faststart -pass 2 out.mp4

# VP9, smaller, preferred by Chrome and Firefox
"$FF" -i source.mov -an -c:v libvpx-vp9 -vf scale=1280:-2 \
  -b:v 900k -crf 33 -row-mt 1 -cpu-used 2 -g 48 out.webm

# poster frame
"$FF" -i source.mov -vf scale=1920:-2 -frames:v 1 -q:v 3 poster.jpg
```

Audio is stripped (`-an`) — hero loops are muted. The page loads the video
only on viewports 768px and wider, and never when the visitor has
data-saver on or prefers reduced motion; the poster carries it otherwise.

## Ticket prices
Do not put prices on these pages. Pricing is subject to change, so each
event links straight to its live ticket page instead of printing a number
that can go stale. "Tickets on sale now" plus the link is the pattern.

## Teaser cuts (Talley Tapes)
Two masters ship: `talley-teaser.mp4` (16:9, clean) and
`talley-teaser-vertical.mp4` (9:16, framed for a phone, with its own
burned-in text). The page picks by viewport at 768px and swaps the poster
and frame aspect to match. Neither is fetched until the visitor presses
play (`preload="none"`), so carrying both costs nothing, and the picker
will not swap the source out from under someone already watching.

Both cuts start at 2.7s, which trims the teaser's Netflix-style intro from
the web versions. The full masters are untouched in the assets folder.

## Local preview
```
python3 -m http.server 4173
```
Then open http://localhost:4173 — the event pages use root-absolute paths,
so opening the files directly with `file://` will not load the CSS.
