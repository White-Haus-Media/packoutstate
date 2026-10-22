# Content to confirm

Placeholders on a built page are marked two ways: visibly, with a dotted
amber underline (`class="draft"`), and in the source with a
`<!-- TODO:CONFIRM -->` comment. A page carrying any of them also shows a
`draft-banner` at the top. **Nothing deploys while a banner is still up.**

---

## Block Party — page built, needs these values
`/block-party`
Sat, Oct 31 · 12:00 PM – 1:00 AM · Killjoy Kitchen & Cocktails, Raleigh
116 N West St · Tickets on sale now

Already real, in the `EVENTS` data on the home page: description, venue,
address, in-and-out wristband policy, bag policy, parking guidance, food
(BBQn4U), DJs (DJ Fredo, Brint City, DJ JMar), security, rain-or-shine,
sell-out warning.

Hero video, venue logo, venue photo and the 2025 album are all in and live
on the page.

Two placeholders remain, each marked on the page:

| # | Field | Placeholder in use | Your answer |
|---|---|---|---|
| 1 | DJ set times | "announced closer to the date" | |
| 2 | Vendor list | "local makers & retail" | |

Confirmed: **21+**, and **12:00 PM is doors**. Kickoff was announced in
Oct 2026 as **12:00 PM ET**, the same time, so there is no tailgate window
before the game and the day opens as a watch party.

Both remaining items are "announced closer to the date" on the page, which
is honest rather than placeholder-ish — this page could ship as-is if you
wanted, once the draft banner comes off.

**Game time is announced: 12:00 PM ET.** NC State vs California at
Carter-Finley, Saturday Oct 31. The "Heads up" notice that said the time was
unknown has been removed from the run of show, and the timeline now carries
real times.

Doors moved to 12:00 PM at the same time, so doors and kickoff are the same
moment and there is no tailgate window before the game. The run of show
opens as a watch party, the lot runs through the game, and the block fills
back up from around 3:30. Do not put a pre-game tailgate row back; it would
describe a window that does not exist.

**No price shown**, same as Talley Tapes — pricing is subject to change,
so the page carries the live ticket link instead of a number that can go
stale. The hero reads "Tickets on sale now".


---

## Not getting a page

**The Warm Up** — free RSVP, one venue, one time. A landing page
over-served it; the home page card carries everything a patron needs.
*(Page was built and removed 2026-09-08.)*

---

## The Talley Tapes — page built, needs these values
`/talley-tapes`
Fri, Oct 30 · 9:00 PM – 2:00 AM · **House of Art**, downtown Raleigh
Tickets on sale now

Venue confirmed 2026-09-14. Banner, teaser, archive photos and the House
of Art logo are all in and live on the page.

| # | Field | Placeholder in use | Your answer |
|---|---|---|---|
| 1 | Dress | `Come like the cameras are out` | |
| 2 | Capacity note | `Limited — this one will sell out` | |

Confirmed: **21+**, **doors 9:00 PM**, and the ticket link. No price shown —
pricing is subject to change, so the Tickets row carries a "Lock it in"
button straight to VenuePilot instead.

**The street address is deliberately withheld**, not missing. The venue
name is announced; the address is not, because House of Art is not
ready to share it yet. The page shows redaction bars and "Address announced soon"
in its place — no address anywhere in the markup, no map link, and the
structured data carries city and state only.

When you get the go-ahead to publish it, four places need updating:
the venue card, the Address row in the premiere list, the `PostalAddress`
in the JSON-LD block, and the `where` field used by the calendar export.
A Directions link can go back in at the same time.

- **House of Art's site is not linked.** It has no venue information up yet.
  Link it once it does.
- **Teaser intro trimmed (decided).** Both web cuts start at 2.7s, leaving
  out the Netflix-style opening. Full masters are untouched.

---

## Clocked Out — undecided

Fri, Oct 30 · District, Raleigh. Has a real booking mechanic (20-minute
photo sessions), which is the kind of thing a page is actually for — but
there is still **no booking link anywhere in the site data**. That link is
the blocker.

Note: the flyer says a 10-minute session, the site copy says 20-minute.
You confirmed 20 is correct and are updating the flyer.

---

## Site-wide

- [ ] Decide how to use the remaining assets: misc photo/video, graphic
      assets, District and Primrose venue folders, the Clocked Out folder
- [ ] Contact address or socials for the footer
