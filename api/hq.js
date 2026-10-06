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

  try {
    const data = await rpc('pos_hq');
    res.status(200).json({ ok: true, ...data });
  } catch (err) {
    console.error('hq failed:', err.message);
    res.status(500).json({ error: 'Could not load the list' });
  }
};
