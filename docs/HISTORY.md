# Pack Out State: history

Why things are the way they are. Moved out of CLAUDE.md in Nov 2026. This
folder is not served by the live site.

## Header

- **Oct 2026:** the two-row header was set on every public page. Colton set the
  header link text to white 12px ("do not grey it back") and confirmed in Nov
  2026 that any new page, such as a planned gallery, keeps the same header.
- **Oct 22 2026:** the Mixtape link was removed from row 2 on all six headers
  at Colton's request, three days before submissions closed (Sunday Oct 25,
  11:59 PM). The `/mixtape` page itself is untouched and live at its own URL.
  Putting the link back is one line per page.
- **Nov 11 2026:** the Thu, Fri and Sat date boxes and the red header button
  (Get tickets, Reserve a time) were removed at Colton's request because the
  weekend was over. Markup, CSS in all three copies, and the home page script
  that drew the boxes all went. The day sections on the home page (`#day-thu`
  and so on) are still there.
- Plain `--red` (#CC0000) proved too dark for "State" on the near-black header,
  which is why the wordmark uses `--red-bright` (#FF3B30).

## Fonts

- **Oct 2026:** Field Gothic Condensed Bold (Adobe Fonts) replaced Anton,
  approved by Colton. Archivo and DSEG7 moved to self-hosting for speed.

## Buttons

- **Oct 2026:** body buttons moved from capitals with heavy padding to body
  text size, because Colton found them too bulky.

## Event facts

- Kickoff was "TBA" for most of the build and was announced in Oct 2026 as
  12:00 PM ET. Block Party doors moved to 12:00 PM at the same time.
- The Warm Up had a landing page built and then removed: a free RSVP with one
  venue and one time did not need one.
- The Talley Tapes teaser videos were pulled from the page in Oct 2026.
- Red label chips and redaction bars were removed as decoration.

## Ticket sync

A scheduled Claude task, `pos-ticket-sync` (9am, 1pm, 5pm, 9pm), read the
OasisTix events list in Colton's Chrome and saved the numbers through
`pos_tickets_record`. It was deleted on Nov 1 2026 at Colton's request. The
last reading was taken Nov 1 2026 at 5:37 PM.

## Publishing

- There used to be two clones of this repo, one in Downloads and one in
  Documents/GitHub. Work happened in both, they drifted a month apart, and a
  deploy nearly wiped the mixtape page off the live site. There is now one
  copy at `~/Projects/clients/packoutstate`.
- **Oct 24 2026:** confirmed that pushing to `main` publishes within a minute.
- **Nov 13 2026:** CLAUDE.md, DESIGN.md, UI-SYSTEM.md, the other notes files,
  `ui-preview.html` and the SQL files were found to be publicly readable on the
  live site. They were added to `.vercelignore`.
