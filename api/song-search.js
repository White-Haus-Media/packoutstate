// Vercel serverless function. Path: /api/song-search?term=...
// Song search for The Talley Mixtape. Zero dependencies.
//
// Why this exists: Apple's search sends iPhones to the Apple Music app
// (a musics:// redirect) instead of returning results, so the page cannot
// call Apple directly on a phone. This function calls Apple from the server
// and returns the results. If Apple fails or rate-limits, it falls back to
// Deezer's public search so people can still find songs.

const FIELDS = ["trackId", "trackName", "artistName", "collectionName", "releaseDate",
  "primaryGenreName", "trackViewUrl", "artworkUrl60", "trackExplicitness"];

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ results: [] });
  }
  const term = String((req.query && req.query.term) || "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (term.length < 2) return res.status(400).json({ results: [] });

  let results = await fromApple(term);
  let source = "apple";
  if (!results) { results = await fromDeezer(term); source = "deezer"; }
  if (!results) return res.status(502).json({ results: [] });

  // Same search from many people: let Vercel's cache answer repeats for a day.
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
  return res.status(200).json({ source, results });
};

async function getJson(url, ms) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, {
      signal: ctl.signal,
      redirect: "error",
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) PackOutState/1.0", Accept: "application/json" },
    });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function fromApple(term) {
  const url = "https://itunes.apple.com/search?media=music&entity=song&country=US&explicit=Yes&limit=15&term=" + encodeURIComponent(term);
  const data = await getJson(url, 5000);
  if (!data || !Array.isArray(data.results)) return null;
  return data.results.map((r) => {
    const o = {};
    for (const k of FIELDS) if (r[k] !== undefined) o[k] = r[k];
    return o;
  });
}

async function fromDeezer(term) {
  const data = await getJson("https://api.deezer.com/search?limit=15&q=" + encodeURIComponent(term), 5000);
  if (!data || !Array.isArray(data.data)) return null;
  // Same shape as Apple's results, without an Apple id.
  return data.data.map((r) => ({
    trackName: r.title || "",
    artistName: (r.artist && r.artist.name) || "",
    collectionName: (r.album && r.album.title) || "",
    artworkUrl60: (r.album && r.album.cover_small) || "",
    trackExplicitness: r.explicit_lyrics ? "explicit" : "notExplicit",
  }));
}
