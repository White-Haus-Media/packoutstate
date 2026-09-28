// Vercel serverless function. Path: /api/contact
// Zero dependencies. Uses fetch for Turnstile, Supabase REST, and Resend.
//
// Required env vars (Vercel > Project > Settings > Environment Variables):
//   TURNSTILE_SECRET_KEY
//   SUPABASE_URL                e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   server-only, never expose to the browser
//   RESEND_API_KEY
//   CLIENT_ID                   short slug, e.g. "signature-pour"
//   FROM_EMAIL                  e.g. "Signature Pour <noreply@mail.signaturepour.com>"
//   NOTIFY_EMAIL                client inbox that receives leads
//   SITE_NAME                   used in subject lines and auto-reply

const REQUIRED = [
  "TURNSTILE_SECRET_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "CLIENT_ID",
  "FROM_EMAIL",
  "NOTIFY_EMAIL",
  "SITE_NAME",
];

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error("Missing env vars:", missing.join(", "));
    return res.status(500).json({ ok: false, error: "Server misconfigured" });
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body || {};
  const {
    name = "",
    email = "",
    phone = "",
    message = "",
    form_name = "contact",
    website = "", // honeypot: must be empty
    "cf-turnstile-response": token = "",
  } = body;

  // Honeypot. Bots fill hidden fields. Return 200 so they think it worked.
  if (website) return res.status(200).json({ ok: true });

  if (!name.trim() || !isEmail(email) || !message.trim()) {
    return res.status(400).json({ ok: false, error: "Name, valid email, and message are required" });
  }

  // 1. Verify Turnstile server-side.
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: token, remoteip: ip }),
  }).then((r) => r.json()).catch(() => ({ success: false }));

  if (!verify.success) {
    return res.status(403).json({ ok: false, error: "Verification failed. Please try again." });
  }

  // 2. Store first. This is the source of truth.
  const record = {
    client_id: process.env.CLIENT_ID,
    form_name,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    message: message.trim(),
    ip,
    user_agent: req.headers["user-agent"] || "",
    referer: req.headers.referer || "",
  };

  const stored = await fetch(`${process.env.SUPABASE_URL}/rest/v1/submissions`, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(record),
  });

  if (!stored.ok) {
    console.error("Supabase insert failed:", stored.status, await stored.text());
    return res.status(500).json({ ok: false, error: "Could not save your message. Please try again." });
  }
  const [row] = await stored.json();

  // 3. Notify the client. from = verified domain, reply_to = visitor. Never swap these.
  const notify = sendEmail({
    from: process.env.FROM_EMAIL,
    to: process.env.NOTIFY_EMAIL,
    reply_to: record.email,
    subject: `New ${form_name} submission from ${record.name}`,
    text: [
      `Name: ${record.name}`,
      `Email: ${record.email}`,
      `Phone: ${record.phone || "n/a"}`,
      ``,
      record.message,
      ``,
      `Submission ID: ${row?.id ?? "n/a"}`,
    ].join("\n"),
  });

  // 4. Auto-reply to the visitor from the client's domain.
  const autoReply = sendEmail({
    from: process.env.FROM_EMAIL,
    to: record.email,
    subject: `Thanks for contacting ${process.env.SITE_NAME}`,
    text: `Hi ${record.name},\n\nWe received your message and will get back to you shortly.\n\n${process.env.SITE_NAME}`,
  });

  const results = await Promise.allSettled([notify, autoReply]);
  const notifyOk = results[0].status === "fulfilled" && results[0].value;

  // Record email outcome on the row so failures are visible and retryable.
  await fetch(`${process.env.SUPABASE_URL}/rest/v1/submissions?id=eq.${row?.id}`, {
    method: "PATCH",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ notified: !!notifyOk, notified_at: notifyOk ? new Date().toISOString() : null }),
  }).catch(() => {});

  // The lead is stored either way. Do not fail the visitor because email lagged.
  return res.status(200).json({ ok: true, id: row?.id });
};

async function sendEmail(payload) {
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      console.error("Resend failed:", r.status, await r.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("Resend error:", e);
    return false;
  }
}

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || "").trim());
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
