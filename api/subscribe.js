// "Get updates" signups. Path: /api/subscribe
//
// Stores an email (and an optional phone) for next year's announcement.
// Nothing is mailed to the person automatically: the list is exported by
// hand when there is news. Same bot checks as the contact form: a honeypot
// field and Cloudflare Turnstile, verified here on the server.

const { rpc, readBody, clean, isEmail } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  let body;
  try { body = await readBody(req); }
  catch { return res.status(400).json({ ok: false, error: 'Could not read that' }); }

  // Honeypot. Bots fill hidden fields; tell them it worked and store nothing.
  if (body.website) return res.status(200).json({ ok: true });

  const email = clean(body.email, 120).toLowerCase();
  const phone = clean(body.phone, 30);
  const source = clean(body.source, 60);
  if (!isEmail(email)) return res.status(400).json({ ok: false, error: 'Enter an email like you@example.com.' });
  if (phone && phone.replace(/\D/g, '').length < 10) {
    return res.status(400).json({ ok: false, error: 'That phone number looks short. Leave it blank if you prefer.' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: body['cf-turnstile-response'] || '',
      remoteip: ip
    })
  }).then(r => r.json()).catch(() => ({ success: false }));
  if (!verify.success) return res.status(403).json({ ok: false, error: 'Verification failed. Please try again.' });

  try {
    const out = await rpc('pos_subscribe', { p_email: email, p_phone: phone, p_source: source });
    return res.status(200).json({ ok: true, already: !!(out && out.already) });
  } catch (err) {
    console.error('subscribe failed:', err.message);
    return res.status(500).json({ ok: false, error: 'Something went wrong on our end. Please try again.' });
  }
};
