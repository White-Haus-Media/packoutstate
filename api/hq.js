// The internal list. One shared password, checked here on the server, never
// in the browser. The page holds no copy of the password and the data is only
// sent once the password checks out.

const { rpc, readBody, clean } = require('./_lib');

// Compares without leaking how much of the password was right through timing.
function sameSecret(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  // Keep this page out of search results even if the URL gets shared.
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const expected = process.env.HQ_PASSWORD;
  if (!expected) {
    console.error('HQ_PASSWORD is not set');
    return res.status(500).json({ error: 'The internal page is not configured yet' });
  }

  let body;
  try { body = await readBody(req); }
  catch { return res.status(400).json({ error: 'Could not read that' }); }

  if (!sameSecret(clean(body.password, 200), expected)) {
    // Slow a guessing attempt down a little without annoying a real person.
    await new Promise(r => setTimeout(r, 600));
    return res.status(401).json({ error: 'Wrong password' });
  }

  // Manual ticket update from the backup form on HQ. The usual source is a
  // scheduled Claude task reading OasisTix, which writes straight to the
  // database through the same function.
  if (Array.isArray(body.tickets)) {
    const rows = [];
    for (const t of body.tickets.slice(0, 3)) {
      if (!TICKET_EVENTS.includes(t && t.event_key)) continue;
      const sold = wholeNumber(t.sold);
      if (sold === null) continue;
      rows.push({ event_key: t.event_key, sold, available: wholeNumber(t.available),
                  sales_cents: wholeNumber(t.sales_cents) });
    }
    if (!rows.length) return res.status(400).json({ error: 'Enter at least one sold count' });
    try { await rpc('pos_tickets_record', { p: rows, p_source: 'manual' }); }
    catch (err) {
      console.error('hq ticket update failed:', err.message);
      return res.status(500).json({ error: 'Could not save the ticket counts' });
    }
  }

  // Bookings, mixtape and tickets load side by side. If one fails the others
  // still show, and the page says which part is missing.
  const [booking, mixtape, tickets] = await Promise.allSettled(
    [rpc('pos_hq'), rpc('pos_hq_mixtape'), rpc('pos_hq_tickets')]);
  if (booking.status === 'rejected') console.error('hq bookings failed:', booking.reason.message);
  if (mixtape.status === 'rejected') console.error('hq mixtape failed:', mixtape.reason.message);
  if (tickets.status === 'rejected') console.error('hq tickets failed:', tickets.reason.message);
  if ([booking, mixtape, tickets].every(r => r.status === 'rejected')) {
    return res.status(500).json({ error: 'Could not load the list' });
  }

  res.status(200).json({
    ok: true,
    ...(booking.status === 'fulfilled' ? booking.value : { bookingError: true }),
    mixtape: mixtape.status === 'fulfilled' ? mixtape.value : null,
    tickets: tickets.status === 'fulfilled' ? tickets.value : null
  });
};

const TICKET_EVENTS = ['warm-up', 'talley-tapes', 'block-party'];

// A blank box means "not given", anything else must be a whole number.
function wholeNumber(v) {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n < 1e9 ? n : null;
}
