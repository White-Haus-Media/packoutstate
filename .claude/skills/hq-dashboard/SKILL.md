---
name: hq-dashboard
description: The private /hq dashboard on packoutstate (Clean Ops look, per-event colors, charts, ticket counts, mixtape results). Use when changing the HQ page, api/hq.js, ticket count readings or anything shown to the internal team.
---

# HQ, the internal dashboard

`/hq` is one password (`HQ_PASSWORD`) for the whole team, who see every name,
email and phone number on it. Colton approved that in Oct 2026. Four tabs:
Overview, Tickets, Clocked Out, Mixtape.

## Look

The "Clean Ops" direction Colton picked out of four mockups: white cards on a
light grey ground, system fonts, no dark background. It is standalone and does
not load `css/site.css`.

Each event has one fixed color, used on every chart, table dot and card edge:

| Event | Color |
|---|---|
| Warm Up | `#B07818` |
| Talley Tapes | `#C8102E` |
| Clocked Out | `#2E6BD1` |
| Block Party | `#14967C` |

The set was checked together for colorblind separation. Change one and
re-check the set. Charts are hand-drawn SVG in the page script, with no chart
library. The sales line needs two readings before it draws.

## Data

`api/hq.js` checks the password, then calls `pos_hq` (bookings) and
`pos_hq_mixtape` (mixtape results) side by side. If one fails the other still
shows. `pos_hq_mixtape` is read only; its SQL is `supabase/hq-mixtape.sql`.

## Ticket counts

Sales came from OasisTix (VenuePilot underneath). Colton's login cannot create
API keys and VenuePilot's public API has no sales data, so readings land in
`packoutstate.ticket_counts` through `pos_tickets_record`.

- The only way a number gets in now is the "Update counts by hand" form on HQ.
- The scheduled sync task was deleted on Nov 1 2026 when the weekend ended.
  HQ's "over 12 hours old" warning is expected now, not a fault. The task's
  prompt is kept at `~/.claude/scheduled-tasks/pos-ticket-sync/SKILL.md` so a
  future event can have it back. It needed the Mac on, the Claude app open and
  Chrome logged in to OasisTix, and it never logged in itself.
- HQ shows the latest reading per event (`pos_hq_tickets`) and when it was
  taken. The final Homecoming 2026 readings are still in the table. SQL is
  `supabase/hq-tickets.sql`.

Dollar totals may show on HQ because it is private. The no-prices rule is for
public pages.
