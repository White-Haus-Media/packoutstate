# Clocked Out booking page

Working spec. Nothing built yet.

Fri, Oct 30 - 4:00 PM to 8:00 PM - District Bar & Lounge,
222 Glenwood Ave, Apt 109, Raleigh NC.

## Decided so far

**Sessions.** 20 minute blocks, 4:00 PM through 7:40 PM start times.
The first six blocks (4:00, 4:20, 4:40, 5:00, 5:20, 5:40) take two groups
each, because a second photographer or videographer is on, and that also
absorbs early arrivals. The last six blocks (6:00 through 7:40) take one
group each.

That works out to 12 + 6 = **18 reservations**. Colton asked for 15 or 16,
so this has room to spare. Open question below on whether to cap it lower.

**Group size.** Six is ideal. Up to 8 or 10 is fine if they tell us in
advance, so anything over 6 asks for a heads up on the form.

**What we collect.** Main contact only: name, email, phone, headcount.
Guest names and emails are optional, not required, so the form stays short.

**Sharing.** Both. After booking they get a share link plus prewritten text
they can forward to their group, and any guest emails they entered get the
details sent to them automatically.

**When full.** Walk-ups welcome message. Reservations closed, but come
anyway and we will fit you in as time allows.

**Changes.** People can cancel or reschedule themselves from a private link
in their confirmation email. A freed slot reopens for everyone else.

**Notifications.** An email to the team for every booking, plus a live list
page showing the full schedule and who is in each slot. That list is the
first piece of the Homecoming HQ page.

**Confirmation message.** Arrive 10 minutes early, check in, have your whole
group there, check your email for the confirmation. Add to calendar on
phone.

## Creator signup (photographers and videographers)

A second form on the same page, separate from guest bookings, for shooters
who want to come work the event.

**What they agree to.** This is a permission agreement, not just a signup,
so the terms sit in a box they have to tick before submitting, and we store
the agreement with a timestamp against their record.

Approved wording, with the credit line removed:

> This is an unpaid volunteer role. By signing up you agree that:
> - All photo and video content from this event is reviewed and approved
>   before it is published.
> - Approved content is shared with DCC Social and District Bar & Lounge
>   for promotional use.
> - Call time is 3:30 PM for setup. The event runs 4:00 to 8:00 PM.
>
> [ ] I have read and agree to the above.

No promise of credit. Dropped because tracking it across every post is not
realistic. Colton approved this version on 2026-10-05.

**Caps.** 3 photographers and 3 videographers, counted separately. When one
role fills, that role closes and the other stays open.

**Hours.** The whole window. 3:30 PM call time through 8:00 PM, same for
everyone.

**What we collect.** Name, email, phone, role (photo or video), and an
optional link for Instagram, a website or a portfolio. Nothing is blocked if
they skip the link.

**On submit.** Confirmed automatically, with a "you are good to go" email
from info@dccsocial.com carrying the 3:30 PM call time and the address.

**Team view.** Creators show on the same live list as guest bookings, on
their own tab, so the team can see who is shooting.

## Answered

1. **Free.** No ticket or purchase required.
2. **Reservations close two days before**, so end of day Wed Oct 28.
   Assuming 11:59 PM unless told otherwise.
3. **Emails send from info@dccsocial.com**, and team notifications go to
   info@dccsocial.com as well. Also logged on the internal page.
4. **Phone number required.**
5. **No photographer or videographer names** on the page for now.
6. **Call it a content shoot.** Guests are not told photo versus video.
7. **Nothing about what to wear or bring** for now.
8. **Open all 18 reservations.**
9. **Live list** lives on an internal page behind a shared password that
   Colton sets, plus the email notifications.

## Still open

**In progress**

- Supabase and Resend approved 2026-10-05.
- DNS verification for dccsocial.com so email can send from
  info@dccsocial.com. Slowest item, worth starting early.

**Decisions still needed**

- Where the booking lives: a full Clocked Out event page with the form on
  it, a booking only page, or an event page that links to a separate
  reserve page.
- Should guests agree to a photo release? Their pictures are being shared
  with DCC Social and District for promotion. Shooters agree to that;
  guests currently do not.
- Can someone sign up as both photographer and videographer, or pick one.
- Until when can people cancel or reschedule themselves. Up to the close
  date, or right up to their slot.
- The shared password for the internal list, and who gets it.
- Are there photos or video for the Clocked Out page, and is the Clocked
  Out folder in the assets drive the right source.

**Assumptions made, say so if wrong**

- Reservations close 11:59 PM Wed Oct 28.
- All times Eastern.
- A group over 6 can still book, it just asks for a heads up. Nobody is
  blocked and no approval step.
- Shooters pick photo or video, not both.

## How it has to be built

A booking page cannot run on static files alone, because a taken slot has to
disappear for everyone, on every device, permanently. Needs:

- **Supabase** for slots and reservations. The database enforces that two
  people cannot take the same slot at the same moment.
- **Resend** for the confirmation and team emails.
- A small amount of server code on Vercel to write bookings safely.

Both services have free tiers that cover an event this size. This is a
change to the project structure, so it needs a yes before any building.
