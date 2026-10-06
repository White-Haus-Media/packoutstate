// What the booking page asks for when it loads: which times are open, how
// many shooter places are left, and whether booking has closed.

const { rpc } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const [slots, creators] = await Promise.all([rpc('pos_slots'), rpc('pos_creator_counts')]);
    // Never cache. A stale list would show a slot that somebody already took.
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ ...slots, creators });
  } catch (err) {
    console.error('slots failed:', err.message);
    res.status(500).json({ error: 'Could not load times' });
  }
};
