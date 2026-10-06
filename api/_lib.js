// Shared helpers for the Clocked Out booking endpoints.
//
// No npm packages on purpose. Node on Vercel has fetch built in, so this
// talks to Supabase and Resend over plain HTTPS and the project stays a
// no-build-step static site.
//
// Every secret below comes from a Vercel environment variable. Nothing is
// written into the code and nothing reaches GitHub.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY   = process.env.RESEND_API_KEY;

const MAIL_FROM  = process.env.MAIL_FROM  || 'Pack Out State <info@dccsocial.com>';
const TEAM_EMAIL = process.env.TEAM_EMAIL || 'info@dccsocial.com';

// Calls one of the pos_ functions in the database. These are the only way in:
// the tables themselves are closed to everyone except this key.
async function rpc(fn, args = {}) {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Supabase is not configured');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`
    },
    body: JSON.stringify(args)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Database error ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

// Email is best effort. A booking that is saved must never be reported as
// failed just because the mail provider hiccuped, so callers log and move on.
async function sendEmail({ to, subject, html, replyTo }) {
  if (!RESEND_KEY) return { skipped: 'no RESEND_API_KEY set' };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_KEY}`
    },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      reply_to: replyTo || TEAM_EMAIL
    })
  });
  if (!res.ok) throw new Error(`Email error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => {
      raw += c;
      if (raw.length > 20000) reject(new Error('Body too large'));
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('Bad JSON')); }
    });
    req.on('error', reject);
  });
}

const clean = (v, max = 200) => String(v == null ? '' : v).trim().slice(0, max);
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// Friday, October 30 at 5:20 PM
function prettyTime(iso) {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}

// Ten minutes before the session, which is the arrival time we tell people.
function arrivalTime(iso) {
  return new Date(new Date(iso).getTime() - 10 * 60000).toLocaleString('en-US', {
    timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit'
  });
}

const VENUE = 'District Bar & Lounge, 222 Glenwood Ave, Apt 109, Raleigh, NC';

module.exports = {
  rpc, sendEmail, readBody, clean, isEmail,
  prettyTime, arrivalTime, VENUE, TEAM_EMAIL
};
