#!/usr/bin/env python3
"""Publish the gallery: Drive folder -> web sizes -> Cloudflare R2 -> gallery/manifest.json.

Runs on Colton's Mac only. Never part of the site build. Uses only the Python
standard library plus two Mac tools: sips (built in) and ffmpeg (Homebrew).

    python3 -I scripts/gallery/publish.py           (add --prune to clear out unused old files)

What it does, per album in scripts/gallery/albums.json:
  photos  -> thumb (900px), large (2400px), original (untouched), one zip of originals
  videos  -> web version (1080p), poster frame, original (untouched)
Every file goes to the private R2 bucket. A file already in the bucket with
the same size is skipped, so running it again only uploads what changed.
Finally it rewrites gallery/manifest.json, which the gallery page reads.

Keys come from .env.local (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
R2_SECRET_ACCESS_KEY, R2_BUCKET). Nothing secret is written anywhere.
"""
import datetime, hashlib, hmac, json, os, re, subprocess, sys, urllib.parse, urllib.request, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DRIVE = os.path.expanduser(
    "~/Library/CloudStorage/GoogleDrive-cpalmer@goldgroupinc.com/Shared drives/DCC Social Inc/Pack Out State Gallery")
WORK = os.path.expanduser("~/Library/Caches/packoutstate-gallery")  # regenerated, safe to delete
LONG_CACHE = "public, max-age=31536000, immutable"


# ---------------------------------------------------------------- settings
def load_env():
    env = {}
    with open(os.path.join(ROOT, ".env.local")) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k] = v.strip().strip('"')
    for k in ("R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"):
        if not env.get(k):
            sys.exit(f"Missing {k} in .env.local")
    return env


ENV = load_env()
HOST = f"{ENV['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com"


# ---------------------------------------------------------------- R2 (S3 API, SigV4)
def _sign(method, key, headers, query=""):
    t = datetime.datetime.now(datetime.timezone.utc)
    amz, day = t.strftime("%Y%m%dT%H%M%SZ"), t.strftime("%Y%m%d")
    headers = {**headers, "host": HOST, "x-amz-date": amz, "x-amz-content-sha256": "UNSIGNED-PAYLOAD"}
    names = sorted(h.lower() for h in headers)
    lower = {k.lower(): str(v).strip() for k, v in headers.items()}
    canon_headers = "".join(f"{n}:{lower[n]}\n" for n in names)
    signed = ";".join(names)
    path = "/" + ENV["R2_BUCKET"] + ("/" + urllib.parse.quote(key) if key else "")
    req = f"{method}\n{path}\n{query}\n{canon_headers}\n{signed}\nUNSIGNED-PAYLOAD"
    scope = f"{day}/auto/s3/aws4_request"
    sts = f"AWS4-HMAC-SHA256\n{amz}\n{scope}\n{hashlib.sha256(req.encode()).hexdigest()}"
    k = ("AWS4" + ENV["R2_SECRET_ACCESS_KEY"]).encode()
    for part in (day, "auto", "s3", "aws4_request"):
        k = hmac.new(k, part.encode(), hashlib.sha256).digest()
    sig = hmac.new(k, sts.encode(), hashlib.sha256).hexdigest()
    headers["Authorization"] = (f"AWS4-HMAC-SHA256 Credential={ENV['R2_ACCESS_KEY_ID']}/{scope}, "
                                f"SignedHeaders={signed}, Signature={sig}")
    headers.pop("host")
    return f"https://{HOST}{path}" + (f"?{query}" if query else ""), headers


def remote_size(key):
    url, h = _sign("HEAD", key, {})
    try:
        with urllib.request.urlopen(urllib.request.Request(url, method="HEAD", headers=h)) as r:
            return int(r.headers.get("Content-Length", -1))
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def upload(path, key, ctype):
    size = os.path.getsize(path)
    if remote_size(key) == size:
        return "skip"
    url, h = _sign("PUT", key, {"Content-Type": ctype, "Content-Length": str(size), "Cache-Control": LONG_CACHE})
    with open(path, "rb") as f:
        req = urllib.request.Request(url, data=f, method="PUT", headers=h)
        with urllib.request.urlopen(req, timeout=3600) as r:
            if r.status != 200:
                raise RuntimeError(f"upload {key} -> {r.status}")
    return "up"


def list_keys():
    keys, token = [], None
    while True:
        q = {"list-type": "2"}
        if token:
            q["continuation-token"] = token
        query = "&".join(f"{urllib.parse.quote(k, safe='')}={urllib.parse.quote(v, safe='')}" for k, v in sorted(q.items()))
        url, h = _sign("GET", "", {}, query)
        body = urllib.request.urlopen(urllib.request.Request(url, headers=h)).read().decode()
        keys += re.findall(r"<Key>([^<]+)</Key>", body)
        m = re.search(r"<NextContinuationToken>([^<]+)</NextContinuationToken>", body)
        if not m:
            return keys
        token = m.group(1)


def delete(key):
    url, h = _sign("DELETE", key, {})
    urllib.request.urlopen(urllib.request.Request(url, method="DELETE", headers=h))


def fingerprint(path):
    """First 8 hex of the file's md5. Goes in every file name, so a changed
    file gets a new name and nobody is stuck with a cached old copy."""
    md5 = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            md5.update(chunk)
    return md5.hexdigest()[:8]


def swap(obj, rename):
    if isinstance(obj, dict):
        return {k: swap(v, rename) for k, v in obj.items()}
    if isinstance(obj, list):
        return [swap(v, rename) for v in obj]
    return rename.get(obj, obj) if isinstance(obj, str) else obj


# ---------------------------------------------------------------- media helpers
def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def dims(path):
    out = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", path],
                         capture_output=True, text=True, check=True).stdout.split()
    return int(out[out.index("pixelWidth:") + 1]), int(out[out.index("pixelHeight:") + 1])


def resize(src, dst, long_edge, quality):
    if not os.path.exists(dst):
        run(["sips", "-Z", str(long_edge), "-s", "format", "jpeg", "-s", "formatOptions", str(quality), src, "--out", dst])


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height:format=duration", "-of", "json", path],
                         capture_output=True, text=True, check=True).stdout
    d = json.loads(out)
    return d["streams"][0]["width"], d["streams"][0]["height"], float(d["format"]["duration"])


def label(iso):
    d = datetime.date.fromisoformat(iso)
    return d.strftime("%a %b ") + str(d.day)


# ---------------------------------------------------------------- main
def main():
    cfg = json.load(open(os.path.join(ROOT, "scripts/gallery/albums.json")))
    manifest = {"updated": datetime.date.today().isoformat(), "years": []}
    keep = set()
    for yr in cfg["years"]:
        year = yr["year"]
        out_year = {"year": year, "albums": []}
        for al in yr["albums"]:
            slug, base = al["slug"], f"{year}/{al['slug']}"
            work = os.path.join(WORK, str(year), slug)
            os.makedirs(work, exist_ok=True)
            album = {"slug": slug, "title": al["title"], "day": label(al["date"]), "date": al["date"],
                     "venue": al["venue"], "photos": [], "videos": []}
            todo = []  # (local path, key, content type)

            # photos
            if al.get("photos"):
                folder = os.path.join(DRIVE, al["photos"])
                files = sorted(f for f in os.listdir(folder) if f.lower().endswith((".jpg", ".jpeg")))
                if al.get("cover") and al["cover"] not in files:
                    print(f"  note: cover {al['cover']} is not in the folder, using the first photo", flush=True)
                # Resized copies are cached under the source file's fingerprint, not its
                # position. Keyed by position, a folder whose photos were replaced kept
                # serving the old thumbnails and the old zip.
                prints = []
                for i, f in enumerate(files, 1):
                    name = f"{slug}-{year}-{i:02d}.jpg"
                    src = os.path.join(folder, f)
                    fp = fingerprint(src)
                    prints.append(fp)
                    for size_name, edge, q in (("thumb", 900, 78), ("large", 2400, 84)):
                        os.makedirs(os.path.join(work, size_name), exist_ok=True)
                        resize(src, os.path.join(work, size_name, fp + ".jpg"), edge, q)
                    w, h = dims(src)
                    tw, th = dims(os.path.join(work, "thumb", fp + ".jpg"))
                    item = {"t": f"{base}/thumb/{name}", "l": f"{base}/large/{name}", "o": f"{base}/original/{name}",
                            "w": tw, "h": th, "ow": w, "oh": h, "bytes": os.path.getsize(src)}
                    album["photos"].append(item)
                    if f == al.get("cover"):
                        album["cover"] = item["t"]
                    todo += [(os.path.join(work, "thumb", fp + ".jpg"), item["t"], "image/jpeg"),
                             (os.path.join(work, "large", fp + ".jpg"), item["l"], "image/jpeg"),
                             (src, item["o"], "image/jpeg")]
                zip_name = f"pack-out-state-{slug}-{year}-photos.zip"
                # The cached zip is named for the exact set of photos in it, so any
                # added, removed or replaced photo builds a fresh one.
                set_id = hashlib.md5("".join(prints).encode()).hexdigest()[:12]
                zip_path = os.path.join(work, f"photos-{set_id}.zip")
                if not os.path.exists(zip_path):
                    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_STORED) as z:
                        for i, f in enumerate(files, 1):
                            z.write(os.path.join(folder, f), f"{slug}-{year}-{i:02d}.jpg")
                album["zip"] = {"k": f"{base}/zip/{zip_name}", "bytes": os.path.getsize(zip_path)}
                todo.append((zip_path, album["zip"]["k"], "application/zip"))
                album.setdefault("cover", album["photos"][0]["t"])

            # videos
            for i, v in enumerate(al.get("videos") or [], 1):
                # a video is a file name, or {"file": ..., "poster_at": seconds, "web_end": seconds}
                # poster_at picks the cover frame; web_end cuts the on-page version there (with a
                # short sound fade). The original download is never changed.
                opts = v if isinstance(v, dict) else {"file": v}
                v, poster_at, web_end = opts["file"], opts.get("poster_at", 4), opts.get("web_end")
                src = os.path.join(DRIVE, v)
                name = f"{slug}-{year}" + (f"-{i}" if i > 1 else "")
                # Cache key: the source's size and modified time, plus the cut settings,
                # so a replaced video or a new poster_at / web_end is re-encoded.
                tag = f"{os.path.getsize(src)}-{int(os.path.getmtime(src))}-{poster_at}-{web_end}"
                web = os.path.join(work, f"{name}-{tag}-1080p.mp4")
                poster = os.path.join(work, f"{name}-{tag}-poster.jpg")
                if not os.path.exists(web):
                    print(f"  encoding {v} (takes a few minutes)", flush=True)
                    cut = ["-t", str(web_end), "-af", f"afade=t=out:st={web_end - 2}:d=2"] if web_end else []
                    run(["ffmpeg", "-y", "-v", "error", "-i", src, *cut, "-vf", "scale=-2:1080,fps=30", "-c:v", "libx264", "-preset", "medium",
                         "-crf", "21", "-maxrate", "8000k", "-bufsize", "12000k", "-pix_fmt", "yuv420p",
                         "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", web + ".tmp.mp4"])
                    os.replace(web + ".tmp.mp4", web)
                if not os.path.exists(poster):
                    run(["ffmpeg", "-y", "-v", "error", "-ss", str(poster_at), "-i", src, "-frames:v", "1",
                         "-vf", "scale=1600:-2", "-q:v", "3", poster])
                w, h, dur = probe(web)
                ow, oh, _ = probe(src)
                vid = {"web": f"{base}/video/{name}-1080p.mp4", "poster": f"{base}/poster/{name}-poster.jpg",
                       "o": f"{base}/original/{name}.mp4", "w": w, "h": h, "ow": ow, "oh": oh,
                       "dur": round(dur), "bytes": os.path.getsize(src), "webBytes": os.path.getsize(web)}
                album["videos"].append(vid)
                album.setdefault("cover", vid["poster"])
                todo += [(web, vid["web"], "video/mp4"), (poster, vid["poster"], "image/jpeg"),
                         (src, vid["o"], "video/mp4")]

            rename = {}
            for n, (path, key, ctype) in enumerate(todo):
                stem, ext = key.rsplit(".", 1)
                rename[key] = f"{stem}-{fingerprint(path)}.{ext}"
                todo[n] = (path, rename[key], ctype)
            album = swap(album, rename)
            print(f"{year} {al['title']}: {len(album['photos'])} photos, {len(album['videos'])} videos", flush=True)
            for path, key, ctype in todo:
                print(f"  {upload(path, key, ctype):4} {key}", flush=True)
                keep.add(key)
            out_year["albums"].append(album)
        manifest["years"].append(out_year)

    dest = os.path.join(ROOT, "gallery", "manifest.json")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "w") as f:
        json.dump(manifest, f, indent=1)
        f.write("\n")
    print("wrote gallery/manifest.json")

    # Tidy the bucket: remove files no album uses any more (old versions,
    # removed photos). Only with --prune, so nothing is deleted by surprise.
    stale = [k for k in list_keys() if k not in keep]
    if "--prune" in sys.argv:
        for k in stale:
            delete(k)
            print(f"  gone {k}")
    elif stale:
        print(f"{len(stale)} old files in the bucket are no longer used. Run with --prune to remove them.")


if __name__ == "__main__":
    main()
