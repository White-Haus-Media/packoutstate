# Pack Out State — UI System

Build reference for packoutstate.com. Covers components, spacing, grid,
anti-patterns, and implementation.

**Scope:** This document does not touch typography or color. Existing tokens
(`--display` Anton, `--sans` Archivo, `--red`, `--red-deep`, `--red-bright`,
`--ink`, `--carbon`, `--bone`, `--white`, `--ash`) are referenced as-is and never
redefined. Every rule below uses them by variable name so the palette and type
stack remain the single source of truth.

### Applied Oct 2026 (event pages)

What is actually in `css/site.css` now, used by Block Party, Talley Tapes,
Clocked Out and HQ (the home page keeps its own inline styles):

- Tokens on `:root`: `--sp-xs` 4, `--sp-sm` 8, `--sp-md` 16, `--sp-lg` 24,
  `--sp-xl` 32, `--sp-2xl` 48, `--sp-3xl` 64, `--sp-4xl` 96, `--sp-5xl` 128,
  `--wrap-narrow` 760px, `--pad` clamp(24px, 5vw, 64px), `--nav-h` 61px
  (measured event-page nav), `--section-y` 64px, 96px from 1024 up.
- Section rhythm: `.section` and the closing `.cta` pad by `--section-y`;
  `.section--tight` is 48; `.section--flush` drops the top padding when two
  sections share a ground (Block Party "The day" to "Who's on the block", Talley
  fact bar to story). Section heading to body is 48, sub-group breaks 32.
- Hero: 96 padding on phones, 128 from 1024. Hero video gets the shared
  `.vidtoggle` pause button (markup documented in site.css).
- Shared lists: `.rules` and `.alsonav` now live in site.css. FAQ and prose
  cap at `--wrap-narrow` or 68ch.
- Breakpoints in use: 480 / 768 / 1024 (one exception: the Block Party photo
  grid keeps a 420px one-column break so large phones stay two-up).
- Reveal animation only hides content under `html.js`, so pages read fine
  without JavaScript.

---

## 0. Three corrections to the brief

These change what this document had to be, so they're stated up front rather than
buried.

**1. There is no Tailwind in this project.** No `package.json`, no
`tailwind.config`, no `@tailwind` directives, no CDN script — zero references.
`index.html` is a single file with an inline `<style>` block and no build step.
This system is therefore written as **vanilla CSS + custom properties + BEM**,
which is what the codebase already uses. A Tailwind mapping is in §6 if you do
intend to migrate, but nothing here requires it.

**2. The body font is Archivo, not Inter.** The only font declarations in the
file are:

```
--display : 'Anton', Impact, sans-serif
--sans    : 'Archivo', system-ui, -apple-system, sans-serif
            'DSEG7-Classic'  ← countdown digits only
```

Inter is not loaded or referenced anywhere. (A grep for "inter" hits
`letter-spacing`, `margin-inline`, `IntersectionObserver` and `setInterval` — all
substring noise.) Nothing below changes this; it's flagged so the doc isn't wrong
about your own site.

**3. BEM is already your convention.** `.nav__inner`, `.board__plate`,
`.event__cta`, `.count__num`, `.glance__col` — the file is already
`block__element--modifier`. §5 documents and extends that rather than imposing
something new.

### Component inventory: what exists vs. what's new

| Component | Status |
|---|---|
| Buttons | **Exists** — `.btn`, `.btn--primary/--ghost/--dark` (9 rules) |
| Event cards | **Exists** — `.event`, `.flyer`, `.chip` (23 rules) |
| Schedule / timeline | **Exists** — `.glance`, `.daygroup` (15 rules) |
| Navigation | **Exists** — `.nav`, `.day-pill` (7 rules) |
| Hero | **Exists** — `.hero`, `.sky` (9 rules) |
| Countdown | **Exists** — `.board`, `.count__*` (12 rules) |
| Event detail boxes | **Exists** — `.xtra`, `.faq`, `.event__details` (18 rules) |
| CTA blocks | **Partial** — `.btnrow` only; needs a real block |
| **Form inputs** | **New** — no `input`/`textarea`/`fieldset` anywhere |
| **Image gallery** | **New** — no gallery markup anywhere |
| **Add to calendar** | **New** — requested; needs `start`/`end` on each event |

Existing components need *normalizing to the scale*, not rebuilding. New ones are
specified in full.

---

## 1. Spacing scale

Your scale, as custom properties. Add to `:root` alongside the existing tokens.

```css
:root{
  --sp-xs : 4px;
  --sp-sm : 8px;
  --sp-md : 16px;
  --sp-lg : 24px;
  --sp-xl : 32px;
  --sp-2xl: 48px;
  --sp-3xl: 64px;
}
```

### Two documented extensions

The scale as given tops out at 64px. That is not enough for desktop section
rhythm on a hero-driven event site — your current code already uses
`clamp(64px, 10vw, 120px)` between sections, and compressing that to 64px would
visibly tighten the page. Rather than silently break the scale, extend it:

```css
  --sp-4xl: 96px;   /* = 2xl × 2 — desktop section rhythm */
  --sp-5xl: 128px;  /* = 3xl × 2 — hero and major breaks only */
```

Both are exact multiples of existing steps, so the scale stays coherent. If you'd
rather hold the line at 64px, delete these two and set `--section-y: var(--sp-3xl)`
— the page will read denser, which is a legitimate choice, just not the current one.

### Reconciling with existing values

The file currently uses off-scale values. Migrate them:

| Currently | Snap to | Where |
|---|---|---|
| `22px` | `--sp-lg` (24) | `.hero__eyebrow` margin |
| `26px`, `28px` | `--sp-lg` (24) or `--sp-xl` (32) | `.xtra` margins, CTA rows |
| `44px` | `--sp-2xl` (48) | `.board`, `.btnrow` margin-top |
| `14px`, `12px` | `--sp-md` (16) or `--sp-sm` (8) | gaps, chip padding |
| `18px`, `20px` | `--sp-md` (16) or `--sp-lg` (24) | grid gaps |
| `6px`, `10px` | `--sp-xs` (4) or `--sp-sm` (8) | tight gaps |

**Rule: never write a raw px value for margin, padding or gap.** If a value isn't
on the scale, either round it to the nearest step or add a documented extension.

### Usage rules

| Step | Use for |
|---|---|
| `xs` 4 | Icon-to-label gaps, chip internal tightening, focus offsets |
| `sm` 8 | Gaps inside a component (list items, tag rows, button groups) |
| `md` 16 | Default internal padding, paragraph spacing, form field gaps |
| `lg` 24 | Card padding, gap between related blocks |
| `xl` 32 | Gap between sub-groups inside a section |
| `2xl` 48 | Section header → section body |
| `3xl` 64 | Mobile section top/bottom |
| `4xl` 96 | Desktop section top/bottom |
| `5xl` 128 | Hero padding, major page breaks |

Vertical rhythm inside a component should use **one step down** from the
component's own padding. A card with `--sp-lg` padding uses `--sp-md` between its
children.

---

## 2. Layout grid

### Container

Keep the existing tokens — they already work:

```css
:root{
  --wrap: 1200px;                        /* existing — do not change */
  --pad : clamp(20px, 5vw, 64px);        /* existing — max aligns to --sp-3xl */
  --wrap-narrow: 760px;                  /* new: prose, forms, FAQ */
}
.wrap        { max-width:var(--wrap);        margin-inline:auto; padding-inline:var(--pad) }
.wrap--narrow{ max-width:var(--wrap-narrow); margin-inline:auto; padding-inline:var(--pad) }
```

`--wrap-narrow` matters: FAQ answers and form fields at 1200px wide are unreadable.
Anything that is primarily running text gets `--wrap--narrow`.

### Breakpoints

The file currently uses ad-hoc values — `860px`, `980px`, `1200px`. Consolidate to
four named steps:

```css
/* sm  480px   large phone
   md  768px   tablet portrait
   lg  1024px  tablet landscape / small laptop
   xl  1280px  desktop                        */
```

Mobile-first: write the base rule for small screens, then `min-width` queries up.

**Migration note — this changes rendering.** Two existing queries move:

| Existing | Becomes | Effect |
|---|---|---|
| `@media(max-width:860px)` on `.event` | `@media(min-width:768px)` inverted to mobile-first | Event cards go two-column 92px earlier |
| `@media(min-width:980px)` on `.nav__cta` | `@media(min-width:1024px)` | Nav CTA appears 44px later |

Both are small but they are visible changes, not refactors. Skip the consolidation
if you want byte-identical rendering — the rest of this system works either way.

### Column system

Don't build a 12-column framework for this site. Four grid primitives cover
everything here, and they're all one line:

```css
/* auto-fit listing — the workhorse. Cards flow and wrap on their own. */
.grid-auto  { display:grid; gap:var(--sp-lg);
              grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)) }

/* fixed pairs — media beside copy */
.grid-2     { display:grid; gap:var(--sp-lg); grid-template-columns:1fr }
@media(min-width:768px){ .grid-2{ grid-template-columns:1fr 1fr } }

/* asymmetric — copy-dominant with a sidebar */
.grid-split { display:grid; gap:var(--sp-xl); grid-template-columns:1fr }
@media(min-width:1024px){ .grid-split{ grid-template-columns:minmax(0,1.6fr) minmax(260px,1fr) } }

/* vertical stack with consistent rhythm */
.stack > * + * { margin-top:var(--stack-gap, var(--sp-md)) }
```

`minmax(0, …)` on `.grid-split` is not optional — without it, long unbroken
strings (URLs, venue names) blow the column out.

### Section spacing

```css
:root{ --section-y: var(--sp-3xl) }
@media(min-width:1024px){ :root{ --section-y: var(--sp-4xl) } }

.section        { padding-block:var(--section-y) }
.section--tight { padding-block:var(--sp-2xl) }
.section--flush { padding-top:0 }          /* when two sections share a ground */
.section__head  { margin-bottom:var(--sp-2xl); max-width:60ch }
```

Two sections with the same background should **not** both carry full padding —
use `--flush` on the second, or the seam reads as a gap rather than a transition.

### Responsive event listings

Event listings are the one thing this site must get right. Three viable layouts,
in order of preference:

**A. Single-column rows (current, recommended).** Each event is a full-width row
with flyer and copy side by side, collapsing to stacked on mobile. Best for 3–8
events — reads as an itinerary, gives each event room, keeps chronological order
obvious.

```css
.event { display:grid; gap:var(--sp-lg); grid-template-columns:1fr;
         padding-block:var(--sp-2xl); border-top:1px solid var(--line-dark) }
@media(min-width:768px){
  .event { gap:var(--sp-3xl); grid-template-columns:1fr 1fr;
           padding-block:var(--sp-3xl); align-items:center }
}
```

Alternating media sides (`:nth-of-type(even)`) is fine at 3–8 events. Past that it
reads as a gimmick — switch to B.

**B. Card grid.** Use when there are 9+ events or when they're peers rather than a
sequence. `.grid-auto` with `minmax(280px, 1fr)`.

**C. Compact list.** Use for an "at a glance" summary alongside A — time, name,
chevron, nothing else. This is what `.glance` already does.

**Do not** make the primary listing a horizontal carousel. See §4.

---

## 3. Component patterns

Every component below: existing tokens only, spacing scale only, mobile-first,
`:focus-visible` on anything interactive.

### 3.1 Buttons — `.btn` *(exists — normalize spacing)*

```css
.btn{
  display:inline-flex; align-items:center; justify-content:center; gap:var(--sp-sm);
  font-family:var(--sans); font-weight:700; font-size:.8rem;
  letter-spacing:.1em; text-transform:uppercase;
  padding:var(--sp-md) var(--sp-lg);
  border:1px solid transparent; border-radius:2px;
  cursor:pointer; text-decoration:none; text-align:center;
  min-height:44px;                    /* touch target floor */
  transition:transform .15s, background .2s, color .2s, border-color .2s;
}
.btn:active{ transform:translateY(1px) }
.btn[aria-disabled="true"], .btn:disabled{
  opacity:.45; pointer-events:none;
}

/* variants — colors are existing tokens, unchanged */
.btn--primary{ background:var(--red);  color:var(--white); }
.btn--primary:hover{ background:var(--red-deep) }
.btn--ghost  { background:transparent; color:var(--white); border-color:var(--line) }
.btn--ghost:hover{ border-color:var(--white) }
.btn--dark   { background:var(--ink);  color:var(--white) }
.btn--dark:hover{ background:var(--carbon) }

/* sizes */
/* smaller type and padding — but 44px stays, it is a tap target not a style */
.btn--sm { padding:var(--sp-sm) var(--sp-md); font-size:.72rem; min-height:44px }
.btn--lg { padding:var(--sp-lg) var(--sp-xl); font-size:.9rem }
.btn--block { display:flex; width:100% }

/* on light grounds */
.section--bone .btn--ghost{ color:var(--ink); border-color:var(--line-dark) }
.section--bone .btn--ghost:hover{ border-color:var(--ink) }
```

**Rules.**
- **One `--primary` per view.** Two competing primaries is the single most common
  event-site conversion mistake. Ticket purchase is primary; everything else is
  ghost.
- Label the action, not the mechanism: "Get tickets", "RSVP free", "Add to
  calendar". Never "Submit" or "Click here".
- Keep the label identical from button → confirmation. A "Get tickets" button
  leads to a page titled "Get tickets".
- `min-height:44px` is a floor, not a suggestion — this site's traffic is
  overwhelmingly phone.
- External ticket links: `target="_blank" rel="noopener"` and say so in the label
  or an adjacent note.

**Button group.**

```css
.btnrow{ display:flex; flex-wrap:wrap; gap:var(--sp-md); margin-top:var(--sp-2xl) }
@media(max-width:479px){ .btnrow .btn{ flex:1 1 100% } }
```

Below 480px, buttons go full-width and equal — ragged stacked buttons of different
widths is the most obvious "unfinished" tell on mobile.

### 3.2 Event card — `.event` *(exists — normalize)*

```css
.event__body   { min-width:0 }              /* prevents overflow blowout */
.event__tags   { display:flex; flex-wrap:wrap; gap:var(--sp-sm); margin-bottom:var(--sp-md) }
.event__name   { font-family:var(--display); text-transform:uppercase; line-height:1.06 }
.event__desc   { margin-top:var(--sp-md); max-width:52ch }
.event__cta    { display:flex; flex-wrap:wrap; gap:var(--sp-md); margin-top:var(--sp-xl) }
.event__onsale { margin-top:var(--sp-md) }

.chip{
  display:inline-flex; align-items:center;
  padding:var(--sp-sm) var(--sp-md);
  font-size:.74rem; font-weight:700; letter-spacing:.14em; text-transform:uppercase;
  border:1px solid currentColor; border-radius:2px;
}
.chip--day   { background:var(--red); border-color:var(--red); color:var(--white) }
.chip--status{ /* sold out / few left — must carry text, never color alone */ }
```

**Every event card answers four questions in the same order, every time:**
**when → where → what it costs → how to get in.** Consistency of order is what
makes a fun event feel organized. Deviating per-card is an information-architecture
failure, not a design flourish.

**Flyer well.** Real artwork keeps its native ratio; placeholders lock to 3:4 so
the layout doesn't shift when art lands:

```css
.flyer      { position:relative; overflow:hidden; border:1px solid var(--line-dark) }
.flyer img  { width:100%; height:auto; display:block }
.flyer--ph  { aspect-ratio:3/4 }
```

Always set `loading="lazy"` on flyers below the fold and give real `alt` text
("The Warm Up flyer"), not `alt=""`.

### 3.3 Schedule / timeline — `.daygroup`, `.glance` *(exists)*

Two distinct jobs; don't merge them.

**Day grouping** — a labelled rule that separates the lineup into days:

```css
.daygroup__label{
  display:flex; align-items:baseline; gap:var(--sp-md);
  padding-block:var(--sp-lg); border-top:2px solid currentColor;
  font-family:var(--display); text-transform:uppercase;
}
```

**At-a-glance columns** — one column per day, scannable:

```css
.glance      { display:grid; gap:var(--sp-md); align-items:start;
               grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)) }
.glance__col { padding:var(--sp-lg); border:1px solid var(--line-dark);
               border-top:4px solid var(--red) }
.glance__item{ display:block; padding-block:var(--sp-md);
               border-top:1px solid var(--line-dark); text-decoration:none }
.glance__item:hover{ padding-left:var(--sp-sm) }   /* nudge, not a jump */
```

**Optional itinerary spine** — a hairline with a tick per event, doubling as scroll
position. Strong for a strictly chronological weekend:

```css
.ev      { display:grid; grid-template-columns:var(--rail) 1fr }
.ev__rail{ position:relative }
.ev__rail::before{ content:''; position:absolute; left:7px; top:0; bottom:0;
                   width:1px; background:var(--line) }
.ev__tick{ position:absolute; left:0; top:.5em; width:15px; height:15px;
           background:var(--red); border-radius:2px }
```

Set `--rail: clamp(32px, 6vw, 88px)`. Below 640px drop to 26px or the copy column
gets squeezed.

### 3.4 Form inputs — `.field` *(new)*

No forms exist yet. This covers RSVP and email capture.

```css
.form   { display:grid; gap:var(--sp-lg); max-width:var(--wrap-narrow) }
.field  { display:grid; gap:var(--sp-sm) }
.field__label{
  font-size:.74rem; font-weight:700; letter-spacing:.14em; text-transform:uppercase;
}
.field__req{ color:var(--red-bright) }              /* the asterisk */
.field__hint{ font-size:.85rem; color:var(--ash) }  /* shown BEFORE the input */

.input, .select, .textarea{
  font-family:var(--sans); font-size:1rem;          /* 16px min — stops iOS zoom */
  width:100%; padding:var(--sp-md);
  min-height:48px;
  background:var(--carbon); color:var(--white);
  border:1px solid var(--line); border-radius:2px;
  transition:border-color .2s;
}
.textarea{ min-height:120px; resize:vertical }
.input::placeholder{ color:var(--ash); opacity:1 }
.input:hover{ border-color:var(--ash) }
.input:focus-visible{ outline:3px solid var(--red); outline-offset:2px;
                      border-color:transparent }

/* light-ground variant */
.section--bone .input{ background:var(--white); color:var(--ink);
                       border-color:var(--line-dark) }

/* validation — never color alone */
.field--error .input { border-color:var(--red-bright); border-width:2px }
.field__error{ display:flex; gap:var(--sp-xs); font-size:.85rem;
               color:var(--red-bright); font-weight:600 }
.field__error::before{ content:'⚠'; }

/* checkbox / radio */
.check{ display:flex; align-items:flex-start; gap:var(--sp-md);
        min-height:44px; cursor:pointer }
.check input{ width:20px; height:20px; margin-top:2px; flex:none; accent-color:var(--red) }

/* inline email capture */
.subscribe{ display:flex; flex-wrap:wrap; gap:var(--sp-md) }
.subscribe .input{ flex:1 1 240px }
```

**Rules.**
- **`font-size:1rem` on inputs is mandatory.** Anything under 16px makes iOS Safari
  zoom on focus, which yanks the layout sideways mid-form.
- Label every input with a real `<label for>`. Placeholders are not labels — they
  vanish on focus and fail screen readers.
- Hints go **above** the input, not below. Below-field hints are read after the
  user has already answered.
- Ask for the minimum. Name + email is enough to RSVP. Every extra field costs
  completions; class year is the only optional field worth its weight here.
- Error messages say what to do: "Enter an email address like you@example.com",
  not "Invalid input".
- Errors must pair color with an icon and text — 1 in 12 men has a color vision
  deficiency, and this audience skews male.
- Mark the required state in the label (`*` plus `aria-required`), and never rely
  on the asterisk's color to carry it.

### 3.5 Navigation — `.nav` *(exists)*

```css
.nav{ position:sticky; top:0; z-index:50;
      background:rgba(11,11,12,.82); backdrop-filter:saturate(140%) blur(10px);
      border-bottom:1px solid var(--line) }
.nav__inner{ display:flex; align-items:center; gap:var(--sp-lg);
             max-width:var(--wrap); margin-inline:auto;
             padding:var(--sp-md) var(--pad) }
.nav__brand{ font-family:var(--display); text-transform:uppercase; white-space:nowrap;
             text-decoration:none }
.nav__days { display:flex; gap:var(--sp-sm); margin-left:auto;
             overflow-x:auto; scrollbar-width:none }
.nav__days::-webkit-scrollbar{ display:none }

.day-pill{ padding:var(--sp-sm) var(--sp-md); border-radius:2px; cursor:pointer;
           white-space:nowrap; border:1px solid var(--line); background:transparent;
           min-height:44px }
.day-pill.is-active{ background:var(--red); border-color:var(--red) }
```

**Rules.** Sticky nav must stay under ~72px tall — it's permanently stealing
viewport on a phone. Keep the day pills scrollable rather than wrapping; a nav that
changes height as it wraps causes layout shift. Always ship a skip link:

```html
<a href="#main" class="skip">Skip to content</a>
```
```css
.skip{ position:absolute; left:-9999px }
.skip:focus{ left:var(--pad); top:var(--sp-sm); z-index:100;
             padding:var(--sp-md); background:var(--red); color:var(--white) }
```

Scroll-spy the day pills to the visible day. If you add a mobile menu, it must
trap focus, close on `Esc`, and return focus to the trigger.

### 3.6 Hero — `.hero` *(exists)*

Structure, in order:

```
eyebrow  →  h1  →  date/location line  →  countdown  →  primary CTA
```

```css
.hero{ position:relative; overflow:hidden;
       min-height:92vh; display:flex; align-items:center;
       padding-block:var(--sp-5xl) }
.hero__inner{ position:relative; z-index:1; max-width:900px }
.hero__eyebrow{ margin-bottom:var(--sp-lg) }
.hero__sub    { margin-top:var(--sp-lg) }
.hero__meta   { margin-top:var(--sp-sm) }
```

**Rules.**
- `min-height:92vh`, never `100vh` — on mobile, `100vh` is taller than the visible
  area because of the browser chrome, so the CTA lands below the fold. If you want
  true full-height, use `100svh`.
- The date and location must be visible without scrolling. They are the two facts
  every visitor came for.
- One CTA in the hero. A second competing button measurably reduces clicks on the
  first.
- Any background photo needs a scrim (a gradient overlay) behind text — never text
  directly on an unmodified photo. Check contrast against the *lightest* pixel the
  text crosses, not the average.
- Decorative layers (`.sky`, ghost wordmarks) get `aria-hidden="true"` and
  `pointer-events:none`.
- Every hero animation must be disabled under `prefers-reduced-motion`.

### 3.7 CTA block — `.cta` *(new — currently only `.btnrow` exists)*

A full-width conversion band for between sections and above the footer.

```css
.cta{ padding-block:var(--sp-4xl); text-align:center }
.cta__inner{ max-width:var(--wrap-narrow); margin-inline:auto;
             padding-inline:var(--pad);
             display:flex; flex-direction:column; align-items:center; gap:var(--sp-lg) }
.cta__title{ font-family:var(--display); text-transform:uppercase; line-height:1.05 }
.cta__note { font-size:.85rem; color:var(--ash) }   /* "Tickets on sale Sept 1" */

.cta--split{ text-align:left }
.cta--split .cta__inner{ max-width:var(--wrap); flex-direction:row;
                         justify-content:space-between; align-items:center }
@media(max-width:767px){
  .cta--split{ text-align:center }
  .cta--split .cta__inner{ flex-direction:column }
}
```

**Rules.** One idea, one button. Put the friction-reducer directly under the button
as `.cta__note` — "Free to RSVP", "Takes 30 seconds", "On sale Sept 1". Don't
repeat the same CTA band more than twice on a page.

### 3.8 Event detail box — `.xtra`, `.faq` *(exists)*

Progressive disclosure via native `<details>` — no JS, keyboard-accessible free.

```css
.xtra{ margin-top:var(--sp-lg); border:1px solid var(--line-dark) }
.xtra summary{
  list-style:none; cursor:pointer; user-select:none;
  display:flex; align-items:center; justify-content:space-between; gap:var(--sp-md);
  padding:var(--sp-md) var(--sp-lg);
  font-weight:700; font-size:.88rem; letter-spacing:.14em; text-transform:uppercase;
  min-height:44px;
}
.xtra summary::-webkit-details-marker{ display:none }
.xtra summary::after{ content:'+'; font-family:var(--display); font-size:1.3rem;
                      line-height:1; transition:transform .2s }
.xtra[open] summary::after{ transform:rotate(45deg) }
.xtra__body{ padding:0 var(--sp-lg) var(--sp-lg); border-top:1px solid var(--line-dark) }

.facts{ list-style:none; display:grid; gap:var(--sp-sm); margin-top:var(--sp-lg) }
.facts li{ display:flex; gap:var(--sp-md) }
.facts .k{ flex:none; min-width:74px; font-size:.74rem; font-weight:700;
           letter-spacing:.14em; text-transform:uppercase; color:var(--ash) }
```

**Rules.** Never collapse essential information. Date, time, venue and price stay
visible; only parking, FAQ and policies go behind a disclosure. Use the same
key order in `.facts` on every event. Address links open a map in a new tab.
Keep `::after` rotation under `prefers-reduced-motion` guard.

### 3.9 Image gallery — `.gallery` *(new)*

```css
.gallery{ display:grid; gap:var(--sp-sm);
          grid-template-columns:repeat(2, 1fr) }
@media(min-width:768px) { .gallery{ grid-template-columns:repeat(3, 1fr);
                                    gap:var(--sp-md) } }
@media(min-width:1024px){ .gallery{ grid-template-columns:repeat(4, 1fr) } }

.gallery__item{ position:relative; aspect-ratio:1; overflow:hidden;
                background:var(--carbon); display:block }
.gallery__item img{ width:100%; height:100%; object-fit:cover; display:block;
                    transition:transform .4s ease }
.gallery__item:hover img,
.gallery__item:focus-visible img{ transform:scale(1.04) }

/* feature the first tile — good for recap galleries */
.gallery--feature .gallery__item:first-child{ grid-column:span 2; grid-row:span 2;
                                              aspect-ratio:auto }
```

**Rules.** Fixed `aspect-ratio` plus `object-fit:cover` means mixed portrait and
landscape photos don't produce a ragged grid. Always set `width`/`height`
attributes on the `<img>` to reserve space and avoid layout shift. `loading="lazy"`
on everything below the fold. Serve galleries at ~1200px max — full-resolution
phone photos will destroy mobile load time. Alt text describes the scene
("Block party crowd outside Killjoy"), and purely decorative tiles get `alt=""`.
If you add a lightbox it must close on `Esc`, trap focus, and be reachable by
keyboard.

### 3.10 Countdown — `.board` *(exists)*

```css
.board{ margin-top:var(--sp-2xl); max-width:680px }
.board__plate{ display:inline-block; padding:var(--sp-sm) var(--sp-lg);
               border-radius:4px 4px 0 0 }
.board__shell{ position:relative; overflow:hidden;
               padding:var(--sp-lg) var(--sp-xl); border-radius:0 8px 8px 8px }
.count{ display:flex; align-items:flex-start; gap:var(--sp-lg) }
.count__unit { text-align:center }
.count__num  { font-variant-numeric:tabular-nums; line-height:1 }
.count__label{ margin-top:var(--sp-sm); font-size:.6rem; letter-spacing:.24em;
               text-transform:uppercase }
```

**Rules.**
- **Tabular numerals are mandatory.** Without them the countdown visibly jitters
  every second as digit widths change.
- Wrap the live region correctly: put `aria-hidden="true"` on the ticking digits
  and expose a single polite summary elsewhere, or a screen reader will announce
  the whole thing every second.
- Handle all three states: counting down, event live, event over. A countdown
  stuck at `00:00:00` after the weekend is the classic abandoned-event-site look.
- Pin the target time to a fixed timezone (`America/New_York` here) so the date
  never drifts by a day for out-of-state visitors.
- Freeze the seconds digit under `prefers-reduced-motion`, or drop to minutes.
- A countdown is not a scarcity device. Don't add one to a form.

### 3.11 Add to calendar — `.cal` *(new)*

Generated in the browser from the event data. No third-party service, no account,
nothing to maintain. Two destinations cover effectively everyone: a Google
Calendar URL, and a `.ics` download that Apple Calendar and Outlook both open.

```css
.cal        { position:relative; display:inline-block }
.cal__trigger{ list-style:none; cursor:pointer; user-select:none }
.cal__trigger::-webkit-details-marker{ display:none }
.cal__menu  { position:absolute; z-index:20; top:calc(100% + var(--sp-sm)); left:0;
              min-width:230px; padding:var(--sp-sm);
              background:var(--white); border:1px solid var(--rule-2);
              box-shadow:0 14px 34px rgba(11,11,12,.16) }
.cal__opt   { display:flex; align-items:center; gap:var(--sp-md);
              padding:var(--sp-md); min-height:44px; text-decoration:none }
@media(max-width:479px){ .cal{ display:block } .cal__menu{ left:0; right:0 } }
```

Built on `<details>/<summary>`, so open/close, keyboard operation and screen
reader semantics come free. Add `Esc` to close and an outside-click handler.

**This needs one data change to ship.** `EVENTS` stores time as a display string
(`'9:00 PM – 1:00 AM'`), which no calendar can parse. Each event needs two
machine-readable fields:

```js
start:'2026-10-29T21:00:00-04:00',
end  :'2026-10-30T01:00:00-04:00',
```

Parsing the display string instead would be guesswork — "9:00 PM – 1:00 AM"
silently crosses midnight, and nothing in the string says which day the end time
belongs to. Two explicit fields remove the ambiguity.

**Rules.**
- Times are converted to UTC for both destinations, so the entry lands correctly
  regardless of the attendee's timezone.
- `.ics` content must use CRLF line endings and escape `\ ; ,` and newlines.
  Fold lines over 75 octets (RFC 5545) or strict clients reject the file.
- Give every event a stable `UID` (`event-id@packoutstate.com`) so re-downloading
  updates the existing entry rather than creating a duplicate.
- Offer a **whole weekend** file as well as per-event: one `.ics` containing all
  four `VEVENT` blocks lets someone commit to the weekend in one tap.
- Put the venue in `LOCATION` as a full street address — calendar apps turn it
  into a map link and a travel-time estimate.
- This is secondary to ticketing. It is a ghost button next to the primary CTA,
  never in place of it.

---

## 4. Anti-patterns to avoid

### What makes event sites look unprofessional

- **Stale content.** Last year's date, an expired countdown, "Coming soon" in
  March. The fastest credibility killer — an event site is judged on whether it
  looks *tended*.
- **Mixed flyer treatments.** Some artwork with borders, some without; some
  square, some 4:5. Pick one treatment and one ratio.
- **Placeholder leakage.** Lorem ipsum, `[ Location TBA ]` with no "announced
  soon" context, grey silhouette avatars, an unstyled broken-image icon.
- **Uncompressed images.** A 4MB flyer is the difference between a 1s and a 12s
  load on stadium wifi.
- **Inconsistent date formats.** "Oct 29", "10/29/26" and "October 29th" on the
  same page.
- **Too many accent colors.** You have a defined palette; stay inside it.
- **Default browser form styling** next to otherwise-styled components.
- **Ragged spacing.** Arbitrary px values are visible even when nobody can name
  what's wrong. This is what §1 exists to fix.

### Common layout mistakes

- **Carousels for the primary lineup.** Roughly 1% of users click past the first
  slide. If an event is worth listing, it's worth being visible without
  interaction.
- **`100vh` heroes on mobile** pushing the CTA below the fold.
- **Full-width running text.** Body copy at 1200px is unreadable. Cap at 60–70
  characters.
- **Equal visual weight for everything.** If the block party and a small mixer look
  identical, the page has no hierarchy.
- **Layout shift** from images without dimensions and fonts without `font-display`.
- **Horizontal scroll on mobile,** almost always from a fixed-width element or an
  unconstrained grid child missing `min-width:0`.
- **Sticky elements eating small screens.** Sticky nav plus sticky CTA bar can take
  30% of a phone viewport.
- **Cards of unequal height with unaligned actions.** Fix with flex and
  `margin-top:auto`.

### Common UX mistakes

- **Ticket price hidden until checkout.** State it, or state plainly that it's
  free. Undisclosed pricing is the top cause of abandonment on event pages.
- **No venue address, or an unlinked one.** Every venue links to a map.
- **Competing CTAs.** Two primary buttons means neither gets clicked.
- **Dead-end "sold out"** with no waitlist, no alternative, no next step.
- **Off-site ticketing with no warning.** Say where the button goes.
- **Asking for too much at RSVP.** Every field costs completions.
- **Untested keyboard access.** Tab through it. If focus disappears behind the
  sticky nav or a disclosure can't be opened with Enter, it's broken.
- **Color-only status.** "Sold out" as a red border with no text.
- **Motion with no escape hatch.** Honor `prefers-reduced-motion` everywhere.
- **Tap targets under 44px.**
- **No confirmation after RSVP.** The user must see that it worked.

### Information architecture mistakes

- **Burying date, time and venue** below the fold or inside a disclosure. These
  three facts are why people came.
- **Reordering events non-chronologically.** For a weekend, chronological order
  *is* the information. Sorting by price or popularity destroys it.
- **Inconsistent field order between cards.** Same order, every event.
- **No single source of truth.** When the schedule lives in an array, the summary,
  the detail cards, and the nav must all render from it. Hand-maintained
  duplicates drift, and the site starts contradicting itself.
- **Separate pages for four events.** At this scale a single page with anchors
  beats navigation.
- **Mixing "what's happening" with "how to attend."** Describe the event, then
  give the mechanics.
- **FAQ answering questions nobody asked** while omitting parking, re-entry, age
  policy and weather.
- **Orphan pages** reachable only by direct link.

---

## 5. Implementation checklist

### Naming — BEM, extending what's already there

```
.block                 .event
.block__element        .event__name
.block--modifier       .btn--primary
.is-state              .is-active, .is-open, .is-error
```

Rules:
- **One block per component.** `.event`, `.cal`, `.gallery`, `.field`.
- **Never nest elements in the name.** `.event__cta`, never
  `.event__body__cta__button`. If you need that depth, it's a new block.
- **Modifiers change one thing.** `.btn--lg` changes size, `.btn--primary` changes
  emphasis. They compose: `class="btn btn--primary btn--lg"`.
- **State classes are `is-` / `has-`** and are the only classes JS toggles. JS
  should never write inline styles for something CSS can express.
- **Never style a bare element** except in a reset. `.facts li`, not `li`.
- **Keep specificity flat.** One class, occasionally two for context
  (`.section--bone .btn--ghost`). No IDs, no `!important` outside the
  reduced-motion block.

### Building a new component

1. Does an existing block cover it? Extend with a modifier before creating a block.
2. Write the markup first, semantic HTML — `<button>` for actions, `<a>` for
   navigation, `<details>` for disclosure, `<label>` for every input.
3. Write mobile-first CSS. Base rule small, `min-width` queries up.
4. Use only scale tokens for margin/padding/gap and only existing tokens for color
   and type. **If you type a raw px value for spacing, stop.**
5. Add `:hover`, `:focus-visible`, `:active`, disabled, and empty states.
6. Check the touch target is ≥44px.
7. Tab through it. Then test with `prefers-reduced-motion: reduce`.
8. Check 360px width for horizontal overflow.

### Consistency

Keep a live component reference. In a single-file build, a commented block index at
the top of `<style>` is enough:

```css
/* ===========================================================
   1 TOKENS   2 LAYOUT   3 BUTTONS   4 NAV   5 HERO
   6 COUNTDOWN   7 EVENTS   8 SCHEDULE   9 CALENDAR
   10 FORMS   11 GALLERY   12 CTA   13 FOOTER   14 A11Y
   =========================================================== */
```

Order the stylesheet the same way and keep every rule for a block together. Nothing
about a component should live in two places.

Before every commit:
- No raw px in margin/padding/gap
- No hardcoded hex outside `:root`
- No new font-family declarations
- Interactive elements have visible focus
- New animation is inside the reduced-motion guard
- No horizontal scroll at 360px

### Scaling the system

**Content stays data-driven.** The `EVENTS` array is already the single source for
the lineup, the at-a-glance summary and the nav. Keep it that way — every new
surface renders from the same array. Adding a fifth event should require editing
one object, not four places.

**When to add a component:** the pattern appears three times. Twice is a
coincidence.

**When to add a token:** only when a value is used in three or more places and has
a name a non-developer would recognize.

**If the site outgrows one file** (roughly: more than ~1200 lines of CSS, or a
second page), split at the block boundary — `tokens.css`, `layout.css`, then one
file per block — and concatenate at build. Don't split before that; the current
no-build single file is a feature, not debt.

**Adding a page:** reuse `.nav`, `.section`, `.btn`, `.cta`, `.foot` unchanged. If
a new page needs a new variant of an existing block, add a modifier rather than a
parallel block.

---

## 6. Appendix — if you do move to Tailwind

Nothing above requires this. If you migrate, the spacing scale maps cleanly to
Tailwind's default 4px base, so most steps are built in:

| Token | px | Tailwind |
|---|---|---|
| `--sp-xs` | 4 | `1` |
| `--sp-sm` | 8 | `2` |
| `--sp-md` | 16 | `4` |
| `--sp-lg` | 24 | `6` |
| `--sp-xl` | 32 | `8` |
| `--sp-2xl` | 48 | `12` |
| `--sp-3xl` | 64 | `16` |
| `--sp-4xl` | 96 | `24` |
| `--sp-5xl` | 128 | `32` |

Breakpoints need overriding — Tailwind's defaults are 640/768/1024/1280, so only
`sm` differs from §2:

```js
// tailwind.config.js
export default {
  theme: {
    screens: { sm:'480px', md:'768px', lg:'1024px', xl:'1280px' },
    extend: {
      maxWidth: { wrap:'1200px', 'wrap-narrow':'760px' },
    },
  },
}
```

Keep the components as `@layer components` classes with the same BEM names rather
than inlining long utility strings in markup — the component contracts in §3 are
what keep the site consistent, and they survive the migration intact.

Do **not** let a Tailwind migration redefine fonts or colors. Reference the
existing custom properties from the config so `:root` stays the single source:

```js
colors: { red:'var(--red)', ink:'var(--ink)', bone:'var(--bone)' }
```
