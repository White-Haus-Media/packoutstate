// Lets someone change or cancel their own booking using the private link in
// their confirmation email. The token is the only credential, so it is never
// put in a page title, a share link or anything we send to their guests.

const {
  rpc, sendEmail, readBody, clean,
  prettyTime, arrivalTime, VENUE, TEAM_EMAIL
} = require('./_lib');

const isUuid = v => /^[0-9a-f-]{36}$/i.test(v);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    const token = clean(req.query && req.query.t, 40);
    if (!isUuid(token)) return res.status(400).json({ error: 'Bad link' });
    try {
      const [found, slots] = await Promise.all([
        rpc('pos_lookup', { p_token: token }),
        rpc('pos_slots')
      ]);
      if (!found || !found.ok) return res.status(404).json({ error: 'We could not find that booking' });
      return res.status(200).json({ ...found, slots: slots.slots, closed: slots.closed });
    } catch (err) {
      console.error('lookup failed:', err.message);
      return res.status(500).json({ error: 'Could not load that booking' });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try { body = await readBody(req); }
  catch { return res.status(400).json({ error: 'Could not read that' }); }

  const token = clean(body.t, 40);
  const action = clean(body.action, 20);
  if (!isUuid(token)) return res.status(400).json({ error: 'Bad link' });

  const tooLate =
    'Changes close 24 hours before the event. Email ' + TEAM_EMAIL + ' and we will sort it out.';

  try {
    if (action === 'cancel') {
      const before = await rpc('pos_lookup', { p_token: token });
      const out = await rpc('pos_cancel', { p_token: token });
      if (!out.ok) {
        return res.status(409).json({
          error: out.error === 'too_late' ? tooLate : 'We could not cancel that booking'
        });
      }
      try {
        await sendEmail({
          to: TEAM_EMAIL,
          subject: `Cancelled: ${before.name}, ${prettyTime(before.starts_at)}`,
          html: `<p>${before.name} cancelled their Clocked Out session.</p>
                 <p>${prettyTime(before.starts_at)} is open again.</p>`
        });
      } catch (err) { console.error('cancel notice failed:', err.message); }
      return res.status(200).json({ ok: true, cancelled: true });
    }

    if (action === 'move') {
      const slot = clean(body.slot, 40);
      if (!isUuid(slot)) return res.status(400).json({ error: 'Pick a new time' });
      const out = await rpc('pos_reschedule', { p_token: token, p_slot: slot });
      if (!out.ok) {
        const messages = {
          too_late: tooLate,
          slot_taken: 'Sorry, that time was just taken. Pick another one.',
          no_such_slot: 'That time is not available.'
        };
        return res.status(409).json({ error: messages[out.error] || 'Could not move that booking' });
      }
      const who = await rpc('pos_lookup', { p_token: token });
      const when = prettyTime(out.starts_at);
      try {
        await sendEmail({
          to: who.email,
          subject: `Your Clocked Out time moved to ${when}`,
          html: `<div style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.55">
            <p><strong>New time:</strong> ${when}</p>
            <p><strong>Arrive by:</strong> ${arrivalTime(out.starts_at)}</p>
            <p><strong>Where:</strong> ${VENUE}</p>
            <p>Arrive 10 minutes early, check in, and have your whole group with you.</p>
          </div>`
        });
        await sendEmail({
          to: TEAM_EMAIL,
          subject: `Moved: ${who.name} is now ${when}`,
          html: `<p>${who.name} moved their session to ${when}.</p>`
        });
      } catch (err) { console.error('move emails failed:', err.message); }
      return res.status(200).json({ ok: true, when, starts_at: out.starts_at });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('manage failed:', err.message);
    return res.status(500).json({ error: 'Something went wrong on our end' });
  }
};
