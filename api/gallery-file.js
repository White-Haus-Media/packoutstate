// Gallery files: sends the browser to a photo or video in the private R2 bucket.
//
//   /api/gallery-file?k=2026/clocked-out/thumb/clocked-out-2026-01.jpg
//   /api/gallery-file?k=...&dl=1     same file, but saved as a download
//
// The bucket stays private. This answers with a short redirect to a signed
// link that works for a few days. Signatures are dated to the start of the
// UTC day, so the same file gets the same link all day and the redirect can
// be cached at Vercel's edge (few function runs, fast repeat loads).
//
// No npm packages: SigV4 signing with Node's built-in crypto.
// Needs R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET in
// Vercel environment variables.

const crypto = require('crypto');

// Only gallery paths written by scripts/gallery/publish.py are allowed.
const KEY_RE = /^\d{4}\/[a-z0-9-]+\/(thumb|large|original|video|poster|zip)\/[a-z0-9-]+\.(jpg|mp4|zip)$/;
const WEEK = 7 * 24 * 3600; // longest a signed R2 link may last

const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest();
const sha = (data) => crypto.createHash('sha256').update(data).digest('hex');
// S3 wants RFC 3986 encoding, which is stricter than encodeURIComponent.
const enc = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

function presign(key, download) {
  const { R2_ACCOUNT_ID: acct, R2_ACCESS_KEY_ID: akid, R2_SECRET_ACCESS_KEY: secret, R2_BUCKET: bucket } = process.env;
  const host = `${acct}.r2.cloudflarestorage.com`;
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const amzDate = `${day}T000000Z`;
  const scope = `${day}/auto/s3/aws4_request`;
  const path = `/${bucket}/${key.split('/').map(enc).join('/')}`;

  const params = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${akid}/${scope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(WEEK),
    'X-Amz-SignedHeaders': 'host'
  };
  if (download) {
    // Drop the 8-character fingerprint publish.py adds to every file name,
    // and avoid "pack-out-state-pack-out-state-..." for the zips.
    const file = key.split('/').pop().replace(/-[0-9a-f]{8}(?=\.\w+$)/, '').replace(/^pack-out-state-/, '');
    params['response-content-disposition'] = `attachment; filename="pack-out-state-${file}"`;
  }
  const query = Object.keys(params).sort().map((k) => `${enc(k)}=${enc(params[k])}`).join('&');
  const request = ['GET', path, query, `host:${host}\n`, 'host', 'UNSIGNED-PAYLOAD'].join('\n');
  const toSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha(request)].join('\n');
  let k = hmac('AWS4' + secret, day);
  for (const part of ['auto', 's3', 'aws4_request']) k = hmac(k, part);
  const sig = crypto.createHmac('sha256', k).update(toSign).digest('hex');
  return `https://${host}${path}?${query}&X-Amz-Signature=${sig}`;
}

module.exports = (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).end();
  const key = String((req.query && req.query.k) || '');
  if (!KEY_RE.test(key)) return res.status(404).end();
  if (!process.env.R2_SECRET_ACCESS_KEY) {
    console.error('gallery-file: R2 environment variables are not set');
    return res.status(503).end();
  }
  const download = req.query.dl === '1';
  // An hour is well inside the signature's life (at least 6 days left).
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.setHeader('Location', presign(key, download));
  res.status(302).end();
};
