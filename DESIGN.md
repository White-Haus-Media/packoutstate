# Pack Out State — Design Direction

NC State Homecoming · Oct 29–31, 2026 · packoutstate.com

---

> ## ⚠ Status: proposal, not the built site
>
> This document describes a direction that was built and then **reverted at the
> client's direction**. The live `index.html` is the original design — Anton
> headings, the original type scale, margins, dark ground, day-pill dates in the
> header, scoreboard countdown and ticker, all unchanged.
>
> **Nothing in this document is currently applied.** Treat it as a menu to
> discuss, not a record of what shipped. **The heading typeface is Anton and does
> not change without explicit agreement.**
>
> ### Parked — not deleted
> The ghosted vertical `HOMECOMING` spine was built, kept briefly, then removed
> with "we may come back to it." It lives in commit `257f610` and is one command
> to restore:
> ```
> git show 257f610 -- index.html   # the spine is the .hero__spine block
> ```
>
> ### Changes to the live site that are NOT from this document
> - Hero date line formats in `America/New_York` rather than the visitor's
>   timezone. A bug fix: the Oct 29 kickoff previously displayed as Oct 30
>   outside North America while the header day pills still read Oct 29.
> - **Night-game hero.** The hero overlay now starts at solid `#0B0B0C` and opens
>   up over the lit stadium. The whole `.sky::before` colour wash was removed —
>   red, then purple and orange — because a coloured bloom at the top edge is
>   exactly what "fade to black" rules out. Stars, clouds and light beams stay.
> - **Hero eyebrow is `--red-bright` (`#FF3B30`).** Against the now-solid black
>   top, `--red` (`#CC0000`) measured **3.36:1** — under the 4.5:1 AA needs at
>   11.5px. `#FF3B30` measures **5.58:1** and is the value the scoreboard digits
>   already use, so it reads as the same accent. Sampled from rendered pixels,
>   not computed against an assumed backdrop. Eyebrows on the bone sections are
>   unaffected — they use `--red-deep` on light grounds.

---

## The argument

The flyers and the website are two different brands right now.

Three of the four flyers sit on a **warm bone ground** with a hot scarlet and a lot of
air. The block party flyer is a **chenille varsity badge** — embroidered letterman
lettering, a giant stitched "26." The current site is near-black `#0B0B0C` with an LED
scoreboard countdown and a scrolling red marquee. That's sports-broadcast. It's a
stadium jumbotron.

The brief asks for warmth, community, nostalgia, inclusion. The flyers already deliver
that. The site doesn't. **The direction below moves the site onto the flyers' ground,
not the other way around** — because the flyers are the thing people actually see on
Instagram before they ever hit the URL, and because a letterman jacket is a warmer,
more alumni-true object than a scoreboard.

This is the one big call in this document. Everything else follows from it.

### What the flyers already established (and the site should inherit)

| Device | Where it appears | Verdict |
|---|---|---|
| Ghosted vertical `HOMECOMING` wordmark, tonal, running up the right edge | Warm Up, Clocked Out | **Keep** — becomes the page spine |
| Vertical credits rail (Darryl Coleman / Colton Palmer / The Slim Creative) in tracked caps | All four | **Keep** — this is community proof, not a byline |
| Tick-mark itinerary: small squares on a hairline rule, one per fact | Warm Up | **Keep** — becomes the event timeline |
| Chenille varsity badge, stitched outline, felt applique | Block Party | **Promote to signature** |
| Repeating ghosted word-stack resolving to solid | Block Party | **Cut in build** — as a flat stripe texture it read as an artifact, not a device |
| Hot scarlet, brighter than official Wolfpack `#CC0000` | All four | **Adopt** — the flyers are right |

---

## PALETTE

Six values. Red and white are non-negotiable NC State; the other four are what keep it
from reading like a 1997 alumni newsletter.

| | Hex | Name | Job |
|---|---|---|---|
| ■ | `#D91F26` | **Chenille Red** | Primary. The flyers' scarlet — hotter and more celebratory than official `#CC0000`. Display type, badges, CTAs. |
| ■ | `#8E1116` | **Jacket Wine** | Deep oxblood. Stitch shadow, pressed states, footer, and **all small red text**. Replaces black as the "dark red" — wool, not ink. |
| ■ | `#C9973F` | **Class Ring** | The alumni artifact. Class years, the "26," earned/complete states. The only non-red accent, used sparingly. |
| □ | `#F2EEE5` | **Talley Bone** | Page ground. Lifted straight off the Warm Up and Clocked Out flyers. |
| □ | `#E3DCCB` | **Chenille Cream** | Second ground. Card fills, and the tint of the ghosted spine wordmark. |
| ■ | `#15171A` | **Charcoal** | Body text, and the single dark section. Neutral, very slightly cool. A warm-shifted near-black was tried first and rejected — at full-bleed size it reads yellow. |

**Why this isn't the default cream-and-terracotta look.** It shares one axis with it — a
warm off-white ground — but that ground is taken from the client's own artwork, and
everything sitting on it is different: a fat athletic slab instead of a high-contrast
serif, a hot scarlet instead of terracotta, and gold instead of a gradient. The cream is
inherited, not chosen.

**Contrast, measured against Talley Bone `#F2EEE5`:**
- Charcoal — 15.7:1. Body text.
- Jacket Wine — 8.1:1. Any red text below 24px, all red links.
- Chenille Red — 4.33:1. **Large text and UI only.** Passes AA Large (3:1), misses AA
  body (4.5:1). Never set body copy in it.
- Class Ring — 2.26:1 on bone. **Decoration and large numerals only** on light grounds.
  On charcoal it's 6.9:1 and fine for text.

On the charcoal ground, body copy is `#A2A5AA` at 7.4:1 — also neutral, so it doesn't
drag warmth back in through the text.

---

## TYPOGRAPHY

Three families, three clearly separated jobs. Notably **not** Anton — the current
display face is the single most common condensed-caps default on the web, and it's
doing nothing here that a face with actual athletic DNA couldn't do better.

### 1. `Ultra` — the badge face
A fat 1970s slab with genuine athletic-department character. Used **only** on chenille
elements: the wordmark lockup, the "26," the four event badges. Maybe six appearances
on the whole page.

It's a costume font if you let it run loose — which is exactly why it's leashed to the
badge. On its own it's loud; wrapped in a stitched outline at 8rem it stops being type
and becomes an object.

### 2. `Anybody` — the voice
Variable-width grotesque (Velvetyne). Set at **Expanded, 700–800** it reads like
chest-front jersey lettering without dressing up as one. Hero headline, section titles,
event names, day markers.

This is the workhorse that replaces Anton, and it's the single fastest way to stop the
page looking templated. Its width axis also means day labels can run narrow and hero
type can run wide from one family.

### 3. `Figtree` — the body
Round geometric with open counters and real warmth. Chosen because it's the closest
honest match to the lowercase on the Clocked Out flyer — *"clocked out / it's a
photoshoot"* — which is the warmest, most welcoming type in the entire asset set. If
the brand already has a friendly voice, it's that one.

Also carries the utility role in tracked caps (`.14em`) for eyebrows, times, and the
credits rail. **No fourth family** — a separate caption face here would be an accessory
worth removing.

### Considered and cut
The script on the Block Party flyer (*"This is how we Homecoming"*). It's a lovely line
but it's one line, and a whole family for one line is indulgence. Set it in Anybody
italic at a large size instead, or let the flyer own it.

### Hosting
All three are self-hosted from `fonts/` (latin subset, ~92 KB total) rather than
loaded from Google Fonts. One less render-blocking third-party request, no
dependency on a CDN staying up, and the page works offline. All three are OFL.

### Scale
```
Hero          Anybody Expanded 800    clamp(2.8rem, 9vw, 7rem)     line-height .88
Badge name    Ultra                   clamp(1.4rem, 3vw, 2.2rem)   tracking .01em
Section       Anybody Expanded 700    clamp(2rem, 5.5vw, 3.6rem)   line-height 1.02
Event name    Anybody Expanded 700    clamp(1.8rem, 4.5vw, 3rem)
Body          Figtree 400             1.0625rem / 1.62             max 62ch
Eyebrow       Figtree 700 caps        .72rem, tracking .22em
Data / time   Figtree 600 caps        .78rem, tracking .14em
```

---

## LAYOUT APPROACH

**The concept: the jacket.** The page reads top to bottom the way a letterman jacket
does — crest, badges, sleeve stripes, the story on the back, the people who wore it.

### Hero — the wordmark stitches itself in
Not a countdown. The hero is the chenille lockup on bone, and on page load the stitch
outline draws first, then the felt fill drops in behind it. One orchestrated moment,
~900ms, fully skipped under `prefers-reduced-motion`.

```
┌───┬──────────────────────────────────────────────────┐
│ H │  NC STATE HOMECOMING · RALEIGH, NC               │
│ O │                                                  │
│ M │   ╔══════════════════════════════════╗           │
│ E │   ║  P A C K  O U T  S T A T E       ║ chenille  │
│ C │   ║           〔 2 6 〕              ║ stitch-in │
│ O │   ╚══════════════════════════════════╝           │
│ M │                                                  │
│ I │   Oct 29 – 31, 2026                              │
│ N │                                                  │
│ G │   90 DAYS · 04 HRS · 22 MIN   ← tracked caps,    │
│   │                                  one line        │
│ ↑ │   [ See the weekend ]                            │
└───┴──────────────────────────────────────────────────┘
  ghosted spine, Chenille Cream — straight from the flyers
```

**The countdown gets demoted.** It moves from a 680px LED scoreboard to a single line of
tracked caps, and then lives permanently in the sticky spine so it's always available
and never dominant. An LED scoreboard is a stadium telling you the score; this weekend
is a reunion, and the reunion doesn't need a jumbotron. If it turns out ticket urgency
needs the volume back, the place to add it is the sticky bar, not the hero.

### How event details stay prominent — the itinerary spine
The tick-mark device from the Warm Up flyer, made structural. A continuous hairline runs
down the lineup with a filled square at each event. It doubles as scroll position: you
always know where you are in the weekend.

```
│ THU ────■  9:00 PM – 1:00 AM
│         │  THE WARM UP
│         │  Primrose Bar & Lounge · Durham
│         │  ┌────────┐  Homecoming starts here.
│         │  │ flyer  │  [ RSVP free ]  [ Details ]
│         │  └────────┘
│         │
│ FRI ────■  5:00 PM – 8:00 PM
│         │  CLOCKED OUT
```

Every event answers the same four questions in the same order and the same position —
**when / where / what it costs / how to get in.** Consistency is what makes a fun event
feel organized. The flyer sits inside the rhythm rather than alternating left-right,
which is the current layout's most templated move.

### How community shines — "Who's in"
A band of small chenille **class-year badges** — `'04 '09 '12 '15 '18 '21 '25` — in
Class Ring gold on Ink Wool. You scan it and find your year. Below it, the credits rail
from the flyers promoted to full size: Darryl Coleman, Colton Palmer, The Slim Creative,
named as the alumni who built this. On every flyer they're a 90°-rotated whisper. On the
site they should be legible, because "alumni put this on for alumni" is the whole
proposition and it's currently invisible.

### How tradition feels — one dark chapter
**The Talley Tapes gets the only dark section on the page.** Ink Wool ground, matching
its own flyer, which is the only dark flyer in the set.

That copy — *"Before the posts, before the stories, before nights became content… Damn,
I remember them Talley parties"* — is the emotional center of this entire site, and it's
currently buried in an event card between two others. Give it a full-bleed break: the
the pull quote large in
Anybody, the body in Figtree at a comfortable reading measure.

**This is the nostalgia/modern balance.** Warm bone is the present tense — the weekend
you're about to have. The single dark section is memory. Because it happens exactly
once, the tonal shift lands instead of becoming the site's default mood. The current
site is dark everywhere, which means nothing is set apart.

### Section order
```
1  Hero              chenille lockup, stitch-in
2  The Letterman Wall    signature — the whole weekend in one screen
3  The Lineup        itinerary spine, four events in chronological order,
                     with the Talley Tapes dark chapter breaking full-bleed
                     in place at Friday 10 PM
4  Every Class       class-year badges + the credits
5  Footer            wine ground, wordmark
```

**Built note — the dark chapter stays in sequence.** The first draft pulled The
Talley Tapes out into its own section after the lineup. It stays where it is
instead: the weekend runs strictly in the order it happens, and the tonal drop
lands at Friday 10 PM, which is when it actually happens. Better than the
original plan — the break now marks a moment in time rather than a change of
subject. Set with `tone: 'dark'` on the event, so it's one field to move.

---

## SIGNATURE ELEMENT

# The Letterman Wall

**Four chenille badges. One per event.**

Not invented — lifted from their own Block Party flyer, where the "26" is already a
stitched varsity applique. The letterman jacket is *the* object of college nostalgia:
you earned it, you kept it, it's in a closet somewhere. A jacket covered in badges is
literally what a weekend of events looks like.

```
        THE WEEKEND
        The weekend at a glance

  ╭──────────╮  ╭──────────╮  ╭──────────╮  ╭──────────╮
  │ ~~THU 29~│  │ ~~FRI 30~│  │ ~~FRI 30~│  │ ~~SAT 31~│
  │   THE    │  │ CLOCKED  │  │  TALLEY  │  │  BLOCK   │
  │  WARM    │  │   OUT    │  │  TAPES   │  │  PARTY   │
  │   UP     │  │          │  │          │  │          │
  │ ~~9 PM~~ │  │ ~~4 PM~~ │  │ ~~10 PM~ │  │ ~12 PM~~ │
  ╰──────────╯  ╰──────────╯  ╰──────────╯  ╰──────────╯
   RSVP free     No ticket     Sept 1        Sept 1
```

**How it's built.** Not an image — CSS, so it stays crisp and editable when the lineup
changes. Chenille Red felt fill, a stitched outline via layered `text-shadow` in Talley
Bone, a fine dashed border inset 3px for the running stitch, a soft `filter: drop-shadow`
underneath so the badge has real applique thickness, and a subtle repeating-gradient
noise for felt nap. Name in `Ultra`, day and time in tracked Figtree caps.

**How it behaves.**
- **On scroll in** — badges stitch on one at a time, 120ms apart. Outline first, then
  fill. Same motion language as the hero wordmark.
- **On hover / focus** — the badge lifts 6px off the felt and its shadow spreads. It's an
  applique with thickness, not a card.
- **On click** — jumps to that event on the spine.
- **Sold out / passed** — the badge desaturates to Chenille Cream with a Class Ring gold
  outline. Earned, not gone.

**Why this and not a scoreboard.**

| Brief asks for | The badge wall delivers |
|---|---|
| College tradition | A letterman badge is the tradition, worn |
| Alumni community | You earned it by being there |
| Nostalgia | The jacket in the closet |
| Celebration but organized | It's decorative *and* it's the index of all four events |
| Shareable | "Got all four badges" is a screenshot |
| Interactive | Stitch-in, lift, jump-to-event |
| Specific to NC State | Wolfpack red chenille, and it's already on their flyer |

It also **replaces two things at once** — the current "weekend at a glance" cards and
the day-pill nav rail collapse into one object that does both jobs better.

---

## Restraint

The badge is the one loud thing. Everything else stays disciplined:

- **Cut the red marquee ticker.** It's decoration that repeats information already on
  screen, and a scrolling banner is the most templated element on the page.
- **Cut the animated dusk sky** — clouds, beams, twinkling stars, six simultaneous
  keyframe animations behind the hero. That's scattered effect where one orchestrated
  moment does more.
- **Cut the LED scoreboard shell.** The countdown survives as a line of type.
- **Keep** the flyer artwork at native ratio. It's good work and it should be the most
  photographic thing on the page.

Three deletions, one addition. If the badge wall is going to be the memorable thing,
nothing near it can be competing for attention.

## Quality floor

Responsive to 360px (badge wall goes 2×2, then a single scroll-snap row). Visible
keyboard focus in Chenille Red at 3px offset. Every badge reachable by tab and
activated by enter. `prefers-reduced-motion` kills the stitch-in, the lift, and the
countdown tick — the badges simply appear. No color-only state: sold-out badges
carry a gold outline *and* a text label.

---

## Copy

**All site copy is the client's, unchanged.** Event descriptions, taglines, FAQ answers,
section headings, leads, meta descriptions, and button labels are carried over verbatim
from the previous build. This document proposes visual direction only — it does not
rewrite words.

The one exception is the "Every class" band, which is a new section with no prior copy
to inherit. Those three lines are placeholder and should be rewritten in the client's
voice.

Two things worth a look, both inherited rather than introduced:
- "NC State Homecoming" appears twice in the hero — once as the eyebrow, once at the
  head of the date line. Left as-is.
- The ticker copy (*"Pack Out State · NC State Homecoming '26 · Oct 29–31 · Raleigh,
  NC"*) has no home now that the marquee is cut. Nothing was lost that isn't already
  stated elsewhere on the page, but the strings are in git history if wanted.

## Open questions

1. **Light ground — confirm.** Moving off near-black is the load-bearing decision here.
   If there's a reason the site is dark that isn't in the repo, this plan needs a rework.
2. **Class years.** The band runs '80 to '26 as a decorative, inclusive range — it is
   deliberately *not* presented as who has RSVP'd, because that data isn't in the repo.
   If real attendee class years exist, showing those would be far stronger.
3. **The script face.** Cut above. Worth a second look only if *"This is how we
   Homecoming"* is meant to be the standing tagline rather than a Vol. 3 flyer line.
4. **Credits.** Darryl Coleman, Colton Palmer, and The Slim Creative are credited on
   all four flyers with no stated role, so the site credits them the same way. If
   they should read as organizers, photographers, or design, say which.

## Verified before shipping

Measured in Chromium at 1440, 1280, 390, and 360 wide:

- All three fonts load and render (checked by glyph metrics, not `document.fonts.check`,
  which returns a false positive for absent families)
- No horizontal overflow at 360px
- `prefers-reduced-motion` leaves every element at full opacity with no animation
- Badges take keyboard focus with a visible 3px outline, and every badge anchor
  resolves to a real element
- Dates render from Eastern time, so a 9 PM Thursday kickoff reads "October 29"
  from any timezone
