// Photographer and videographer signups.
//
// The agreement text they ticked is stored with their record, word for word.
// If the wording changes later, the record still shows what each person
// actually agreed to rather than whatever the current version says.

const {
  rpc, sendEmail, readBody, clean, isEmail, VENUE, TEAM_EMAIL
} = require('./_lib');

const AGREEMENT = [
  'This is an unpaid volunteer role. By signing up you agree that:',
  'All photo and video content from this event is reviewed and approved before it is published.',
  'Approved content is shared with DCC Social and District Bar & Lounge for promotional use.',
  'Call time is 3:30 PM for setup. The event runs 4:00 to 8:00 PM.'
].join(' ');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try { body = await readBody(req); }
  catch { return res.status(400).json({ error: 'Could not read that' }); }

  const name  = clean(body.name, 80);
  const email = clean(body.email, 120).toLowerCase();
  const phone = clean(body.phone, 30);
  const role  = clean(body.role, 10);
  const link  = clean(body.link, 200);

  if (name.length < 2) return res.status(400).json({ error: 'Please add your name' });
  if (!isEmail(email)) return res.status(400).json({ error: 'That email does not look right' });
  if (phone.replace(/\D/g, '').length < 10) return res.status(400).json({ error: 'Please add a phone number' });
  if (role !== 'photo' && role !== 'video') return res.status(400).json({ error: 'Pick photo or video' });
  if (body.agreed !== true) return res.status(400).json({ error: 'Please agree to the terms' });

  let out;
  try {
    out = await rpc('pos_creator_signup', {
      p_name: name, p_email: email, p_phone: phone,
      p_role: role, p_link: link, p_agreed_text: AGREEMENT
    });
  } catch (err) {
    console.error('creator signup failed:', err.message);
    return res.status(500).json({ error: 'Something went wrong on our end. Please try again.' });
  }

  if (!out || !out.ok) {
    if (out && out.error === 'role_full') {
      return res.status(409).json({
        error: role === 'photo'
          ? 'Photo spots are full. Email ' + TEAM_EMAIL + ' and we will keep you in mind.'
          : 'Video spots are full. Email ' + TEAM_EMAIL + ' and we will keep you in mind.'
      });
    }
    return res.status(409).json({ error: 'Could not complete that signup' });
  }

  try {
    await sendEmail({
      to: email,
      subject: 'You are good to go for Clocked Out',
      html: `<div style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.55;color:#111">
        <h2 style="margin:0 0 14px">You are confirmed to shoot Clocked Out</h2>
        <p style="margin:0 0 6px"><strong>Call time:</strong> 3:30 PM for setup, Friday October 30</p>
        <p style="margin:0 0 6px"><strong>Event runs:</strong> 4:00 PM to 8:00 PM</p>
        <p style="margin:0 0 16px"><strong>Where:</strong> ${VENUE}</p>
        <p style="margin:0 0 16px">Bring your own gear. Sessions run back to back in 20 minute blocks, so arriving at 3:30 gives us time to set up before the first group.</p>
        <p style="margin:0 0 6px;color:#666;font-size:13px">What you agreed to when you signed up:</p>
        <p style="margin:0 0 16px;color:#666;font-size:13px">${AGREEMENT}</p>
        <p style="margin:0">Questions, reply to this email.</p>
      </div>`
    });
  } catch (err) { console.error('creator email failed:', err.message); }

  try {
    await sendEmail({
      to: TEAM_EMAIL,
      replyTo: email,
      subject: `New ${role === 'photo' ? 'photographer' : 'videographer'}: ${name}`,
      html: `<div style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6">
        <p>${name}<br>${email}<br>${phone}</p>
        <p><strong>Role:</strong> ${role === 'photo' ? 'Photographer' : 'Videographer'}</p>
        ${link ? `<p><strong>Link:</strong> ${link}</p>` : ''}
      </div>`
    });
  } catch (err) { console.error('team email failed:', err.message); }

  res.status(200).json({ ok: true, role });
};
