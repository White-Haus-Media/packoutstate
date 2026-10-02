// Vercel serverless function. Path: /api/mixtape
// The Talley Mixtape submissions. Zero dependencies.
//
// Uses the env vars already set for /api/contact:
//   TURNSTILE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Writes through one database function, public.talley_mixtape_submit
// (see supabase/talley-mixtape.sql). No emails are sent.

// Submissions close Sunday, Oct 11, 2026 at 11:59 PM Eastern.
const CLOSES_AT = Date.parse("2026-10-12T03:59:59Z");

const PROMPT_SLOTS = ["takes_me_back", "first_five_seconds", "whole_room_knew", "lights_coming_on"];
const MAX_TOP10 = 5;
const MIN_YEAR = 1960;
const MAX_YEAR = 2026;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (Date.now() > CLOSES_AT) {
    return res.status(410).json({ ok: false, closed: true, error: "Submissions are closed." });
  }

  const missing = ["TURNSTILE_SECRET_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter((k) => !process.env[k]);
  if (missing.length) {
    console.error("Missing env vars:", missing.join(", "));
    return res.status(500).json({ ok: false, error: "Something went wrong. Please try again." });
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body || {};

  // Honeypot. Bots fill hidden fields. Return 200 so they think it worked.
  if (body.website) return res.status(200).json({ ok: true });

  const fullName = clean(body.full_name, 80);
  const email = clean(body.email, 254).toLowerCase();
  const igHandle = clean(body.ig_handle, 40).replace(/^@+/, "");
  const eraStart = parseInt(body.era_start, 10);
  const eraEnd = parseInt(body.era_end, 10);

  if (fullName.length < 2) return bad(res, "Please complete this field.", "full_name");
  if (!isEmail(email)) return bad(res, "Please enter a valid email address.", "email");
  if (!(eraStart >= MIN_YEAR && eraStart <= MAX_YEAR)) return bad(res, "Please complete this field.", "era_start");
  if (!(eraEnd >= MIN_YEAR && eraEnd <= MAX_YEAR)) return bad(res, "Please complete this field.", "era_end");
  if (eraEnd < eraStart) return bad(res, "Please check your years. The start year should come before the end year.", "era_end");
  if (eraEnd - eraStart > 15) return bad(res, "Please check your years.", "era_end");

  // Picks: one per prompt, up to 5 in the Top 5, no repeats inside the Top 5.
  const raw = Array.isArray(body.picks) ? body.picks : [];
  const picks = [];
  const seenPrompt = new Set();
  const seenTop10 = new Set();
  for (const p of raw) {
    const slot = String(p && p.slot || "");
    const title = clean(p.title, 200);
    const artist = clean(p.artist, 200);
    if (!title || !artist) continue;
    const id = /^\d{1,15}$/.test(String(p.itunes_track_id || "")) ? String(p.itunes_track_id) : "";
    const key = id || (artist + "|" + title).toLowerCase();
    if (PROMPT_SLOTS.includes(slot)) {
      if (seenPrompt.has(slot)) continue;
      seenPrompt.add(slot);
    } else if (slot === "top10") {
      if (seenTop10.has(key) || seenTop10.size >= MAX_TOP10) continue;
      seenTop10.add(key);
    } else {
      continue;
    }
    const position = slot === "top10" ? seenTop10.size : PROMPT_SLOTS.indexOf(slot) + 1;
    picks.push({
      slot,
      position,
      itunes_track_id: id,
      title,
      artist,
      album: clean(p.album, 200),
      release_year: /^\d{4}$/.test(String(p.release_year || "")) ? String(p.release_year) : "",
      genre: clean(p.genre, 60),
      apple_url: /^https:\/\/(music|itunes)\.apple\.com\//.test(String(p.apple_url || "")) ? clean(p.apple_url, 400) : "",
    });
  }
  if (!picks.length) return bad(res, "Please add at least one song.", "picks");

  // Verify Turnstile server-side.
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: body["cf-turnstile-response"] || "", remoteip: ip }),
  }).then((r) => r.json()).catch(() => ({ success: false }));

  if (!verify.success) {
    return res.status(403).json({ ok: false, error: "Verification failed. Please try again." });
  }

  const payload = {
    email,
    full_name: fullName,
    ig_handle: igHandle,
    era_start: eraStart,
    era_end: eraEnd,
    marketing_opt_in: body.marketing_opt_in === true || body.marketing_opt_in === "true",
    source: clean(body.source, 40),
    ip,
    user_agent: clean(req.headers["user-agent"], 400),
    picks,
  };

  const stored = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/talley_mixtape_submit`, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p: payload }),
  }).catch((e) => ({ ok: false, status: 0, text: async () => String(e) }));

  if (!stored.ok) {
    console.error("Mixtape insert failed:", stored.status, await stored.text());
    return res.status(500).json({ ok: false, error: "Something went wrong. Please try again." });
  }

  return res.status(200).json({ ok: true });
};

function bad(res, error, field) {
  return res.status(400).json({ ok: false, error, field });
}

function clean(s, max) {
  return String(s == null ? "" : s).replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || "").trim());
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
