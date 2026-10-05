// Takes a booking.
//
// The database decides who gets a slot, not this file. If two people submit
// the same time at the same moment, one insert wins and the other comes back
// as slot_taken, which is reported honestly rather than papered over.

const {
  rpc, sendEmail, readBody, clean, isEmail,
  prettyTime, arrivalTime, VENUE, TEAM_EMAIL
} = require('./_lib');

const CONSENT_TEXT =
  'I agree that photos and video from this event may be used by Pack Out State, ' +
  'DCC Social and District Bar & Lounge for promotional purposes.';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try { body = await readBody(req); }
  catch { return res.status(400).json({ error: 'Could not read that' }); }

  const slot  = clean(body.slot, 40);
  const name  = clean(body.name, 80);
  const email = clean(body.email, 120).toLowerCase();
  const phone = clean(body.phone, 30);
  const notes = clean(body.notes, 400);
  const party = parseInt(body.party, 10);

  const guests = (Array.isArray(body.guest_emails) ? body.guest_emails : [])
    .map(e => clean(e, 120).toLowerCase())
    .filter(isEmail)
    .slice(0, 12);

  if (!slot) return res.status(400).json({ error: 'Pick a time first' });
  if (name.length < 2) return res.status(400).json({ error: 'Please add your name' });
  if (!isEmail(email)) return res.status(400).json({ error: 'That email does not look right' });
  if (phone.replace(/\D/g, '').length < 10) return res.status(400).json({ error: 'Please add a phone number' });
  if (!(party >= 1 && party <= 20)) return res.status(400).json({ error: 'How many people are coming?' });
  if (body.consent !== true) return res.status(400).json({ error: 'Please agree to the photo release' });

  let out;
  try {
    out = await rpc('pos_reserve', {
      p_slot: slot, p_name: name, p_email: email, p_phone: phone,
      p_party: party, p_guest_emails: guests, p_notes: notes,
      p_consent: true, p_consent_text: CONSENT_TEXT
    });
  } catch (err) {
    console.error('reserve failed:', err.message);
    return res.status(500).json({ error: 'Something went wrong on our end. Please try again.' });
  }

  if (!out || !out.ok) {
    const messages = {
      slot_taken: 'Sorry, that time was just taken. Pick another one.',
      closed: 'Reservations are closed for this event.',
      no_such_slot: 'That time is no longer available.',
      consent_required: 'Please agree to the photo release.'
    };
    return res.status(409).json({ error: messages[out && out.error] || 'Could not book that time' });
  }

  const when = prettyTime(out.starts_at);
  const arrive = arrivalTime(out.starts_at);
  const site = 'https://packoutstate.com';
  const manage = `${site}/clocked-out/manage?t=${out.token}`;
  const share = `${site}/clocked-out`;

  // Saved already. Email problems get logged, never shown as a failed booking.
  const guestList = `
      <p style="margin:0 0 6px"><strong>Your time:</strong> ${when}</p>
      <p style="margin:0 0 6px"><strong>Arrive by:</strong> ${arrive}</p>
      <p style="margin:0 0 6px"><strong>Where:</strong> ${VENUE}</p>
      <p style="margin:0 0 16px"><strong>Your group:</strong> ${party} people</p>
      <p style="margin:0 0 6px">Please arrive 10 minutes early and check in at the front.</p>
      <p style="margin:0 0 16px">Have your whole group there before your time starts. Sessions run back to back, so a late group is a short group.</p>
      <p style="margin:0 0 16px"><a href="${manage}">Change or cancel your time</a></p>`;

  try {
    await sendEmail({
      to: email,
      subject: `You are booked for Clocked Out, ${when}`,
      html: `<div style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.55;color:#111">
        <h2 style="margin:0 0 14px">Clocked Out, you are in</h2>${guestList}
        <p style="margin:0 0 6px">Tell your group: <a href="${share}">${share}</a></p>
        <p style="margin:24px 0 0;color:#666;font-size:13px">Pack Out State, NC State Homecoming 2026</p>
      </div>`
    });
  } catch (err) { console.error('guest email failed:', err.message); }

  if (guests.length) {
    try {
      await sendEmail({
        to: guests,
        subject: `${name} booked your group a session at Clocked Out`,
        html: `<div style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.55;color:#111">
          <h2 style="margin:0 0 14px">You are part of ${name}'s group</h2>${guestList.replace(/<p style="margin:0 0 16px"><a href="[^"]*">Change or cancel your time<\/a><\/p>/, '')}
          <p style="margin:0 0 6px">More on the night: <a href="${share}">${share}</a></p>
        </div>`
      });
    } catch (err) { console.error('guest list email failed:', err.message); }
  }

  try {
    await sendEmail({
      to: TEAM_EMAIL,
      replyTo: email,
      subject: `New Clocked Out booking: ${name}, ${when}`,
      html: `<div style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6">
        <p><strong>${when}</strong></p>
        <p>${name}<br>${email}<br>${phone}<br>${party} people</p>
        ${notes ? `<p><strong>Note:</strong> ${notes}</p>` : ''}
        ${guests.length ? `<p><strong>Guests emailed:</strong> ${guests.join(', ')}</p>` : ''}
      </div>`
    });
  } catch (err) { console.error('team email failed:', err.message); }

  res.status(200).json({
    ok: true,
    when,
    arrive,
    venue: VENUE,
    party,
    manage_url: manage,
    token: out.token,
    starts_at: out.starts_at
  });
};
