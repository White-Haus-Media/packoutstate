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

Draft wording, needs Colton's approval:

> This is an unpaid volunteer role. By signing up you agree that:
> - All photo and video content from this event is reviewed and approved
>   before it is published.
> - Approved content is shared with DCC Social and District Bar & Lounge
>   for promotional use.
> - You will be credited on content that is posted.
> - Call time is 3:30 PM for setup. The event runs 4:00 to 8:00 PM.
>
> [ ] I have read and agree to the above.

**What we collect.** Name, email, phone, role (photographer, videographer,
or both), and social handle. The handle matters because crediting is part of
the deal and it makes tagging effortless on the night.

**On submit.** They are confirmed automatically and get a "you are good to
go" email with the 3:30 PM call time, the address, and what to bring.

**Team view.** Creators show on the same live list as guest bookings, on
their own tab, so the team can see who is shooting.

## Still to ask

1. Is the session free, or does it require a ticket or purchase at District?
2. When do reservations close? Night before, day of, or right up to the slot?
3. What email address should confirmations come from, and where do team
   notifications go? Sending from a packoutstate.com address needs a DNS
   record added at whoever holds the domain.
4. Is phone number required or optional?
5. Photographer and videographer names, if they should be credited.
6. Is video a separate thing people choose, or is it just part of the
   session?
7. Anything to tell people about what to wear or bring.
8. Cap at 16 and hold 2 back, or open all 18?
9. Who on the team should be able to see the live list?

On the creator signup:

10. Approve the disclaimer wording above, or send your own.
11. Is there a cap on how many shooters you take, or is everyone in?
12. Do creators sign up for the whole window, or pick a shift?
13. How do you want credit handled, a tag on the post or a name in the
    caption? This decides what we ask for on the form.
14. Do you want a portfolio or sample work link on the form, or keep it open
    to anyone?
15. Should creator emails come from the same address as guest
    confirmations?

## How it has to be built

A booking page cannot run on static files alone, because a taken slot has to
disappear for everyone, on every device, permanently. Needs:

- **Supabase** for slots and reservations. The database enforces that two
  people cannot take the same slot at the same moment.
- **Resend** for the confirmation and team emails.
- A small amount of server code on Vercel to write bookings safely.

Both services have free tiers that cover an event this size. This is a
change to the project structure, so it needs a yes before any building.
