---
name: event-pages
description: How the packoutstate event landing pages are organized (Block Party, Talley Tapes, Clocked Out), plus venues, logos, kickoff facts, buttons and hero or teaser video. Use when building or editing an event page, the home page hero or event cards, or venue and schedule content.
---

# Event landing pages

## When an event gets a page

Not every event does. A page is worth building when someone needs to gather
something before they go: a schedule, policies, a booking step. A free RSVP
with one venue and one time needs a good card on the home page, not a page.
The Warm Up had a page built and removed for this reason.

Each page has its own organising principle and its own layout. Do not build a
shared template and stamp it out.

- **Block Party is organised around TIME.** It runs 10.5 hours across a
  football game, so the question is when to come and how it works around
  kickoff. Timeline, wristband re-entry rule, FAQ, photo grid.
- **Talley Tapes is organised around STORY.** A Homecoming party at House of
  Art, not a documentary screening. Colton's line: same people, different era,
  same energy. The one sheet leads, facts sit directly under it, the lore
  follows, the archive is evidence, the FAQ ends it. No timeline, no photo
  grid. The teaser videos are off the page; the cuts are still in `assets/`.

Give a home page event a `pageUrl` and its card links to the landing page
instead of the outside details link.

## Schedule facts

Kickoff was 12:00 PM ET, NC State vs California at Carter-Finley. Block Party
doors were also 12:00 PM, so there was no tailgate window before the game. The
run of show opens as a watch party, the lot runs through the game, and the
block fills back up from about 3:30. Do not add a pre-game tailgate row. Any
"Kickoff TBA", "Until kickoff" or "Time TBA" left in the code is stale.

## Home page hero

The hero text (`[data-animate]`) fades in on DOMContentLoaded. Keep it off the
window `load` event, which held it back about 6 seconds on a phone.

## Buttons

Buttons in the page body (`.btn`, and `.submit` on the mixtape page) use body
text size (1.05rem), normal case, bold, 44px tall. Colton found the old
capitals-and-padding buttons too bulky. The rule sits at the end of
`index.html`, `css/site.css` and the mixtape page so it wins.

## Venues

- Each venue ships two logo files, white and black. Pick per placement by the
  section's background. The site does not switch themes at runtime.
- Venue logos link to the venue's own site. Killjoy links to
  killjoycocktail.com. House of Art is deliberately not linked.
- House of Art's street address stays off the site. When it is cleared, four
  places need it: the venue card, the Address row, the PostalAddress in the
  JSON-LD, and the `where` field used by the calendar export. A directions
  link can go back at the same time.

## Video

General hero video rules are in the `static-site-conventions` skill, and the
exact encode commands are in `README.md`. Specific to this site:

- After checking viewport width for video, check again on resize. A tab that
  has not been laid out yet reports a zero width.
- Talley Tapes has two teaser cuts, 16:9 and 9:16. The page picks by viewport
  and will not swap the file under someone already watching. Both start at 2.7
  seconds to trim an intro. The full masters are untouched in `assets/`.
