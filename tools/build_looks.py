"""Build data/looks.js: how alike each pair of venues looks, from their photos.

Run from the repo root, in its own environment (about 1 GB of model files on the first run):
    python3 -m venv .venv-looks
    .venv-looks/bin/pip install -r tools/requirements-looks.txt
    .venv-looks/bin/python tools/build_looks.py

Reads   data/photos.js   (photos linked from each venue's site, with a kind: front, outdoor, indoor, extra)
Writes  data/looks.js    (window.LOOKS: for each venue, every other venue with a 0-1 look score, best first)

An image model (CLIP) turns each photo into a fingerprint of its look. Venues are compared kind to kind
(indoor to indoor, outdoor to outdoor, front to front) plus all photos together, with the main room weighted
most since that's what people picture. Photos are downloaded only to a local cache in .venv-looks/ and are
never committed; the site keeps linking to the venues' own copies. Rerun whenever data/photos.js changes.
"""
import hashlib, io, json, ssl, sys, urllib.request
from pathlib import Path

import certifi, open_clip, torch
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".venv-looks" / "photo-cache"
MODEL, PRETRAINED = "ViT-B-16", "datacomp_xl_s13b_b90k"
WEIGHTS = {"indoor": 3, "outdoor": 2, "front": 1, "all": 2}  # "all" = every photo, extras included
# A photo that reads more like these than like a venue is probably a detail shot (cake, rings, people)
# and says little about the room; it's listed at the end so someone can swap it in data/photos.js.
VENUE_TEXT = ["a photo of a wedding venue room", "a photo of a wedding venue building", "a photo of an outdoor wedding venue"]
DETAIL_TEXT = ["a close-up photo of food or a wedding cake", "a close-up photo of flowers or table details", "a portrait photo of people"]


def load_photos():
    text = (ROOT / "data" / "photos.js").read_text()
    return json.loads(text[text.index("{"):text.rindex("}") + 1])


def fetch(url):
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / hashlib.sha1(url.encode()).hexdigest()
    if not path.exists():
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (cs356 venue look builder)"})
        with urllib.request.urlopen(req, timeout=30, context=ssl.create_default_context(cafile=certifi.where())) as r:
            path.write_bytes(r.read())
    return Image.open(io.BytesIO(path.read_bytes())).convert("RGB")


def unit(t):
    return t / t.norm(dim=-1, keepdim=True)


def main():
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    model, _, preprocess = open_clip.create_model_and_transforms(MODEL, pretrained=PRETRAINED, device=device)
    tokenizer = open_clip.get_tokenizer(MODEL)
    model.eval()
    with torch.no_grad():
        venue_t = unit(model.encode_text(tokenizer(VENUE_TEXT).to(device))).cpu()
        detail_t = unit(model.encode_text(tokenizer(DETAIL_TEXT).to(device))).cpu()

    photos, failed, details = load_photos(), [], []
    fingerprints = {}  # venue id -> {kind: unit vector}
    for vid, entry in photos.items():
        by_kind = {}
        for p in entry["photos"]:
            try:
                img = fetch(p["src"])
            except Exception as e:  # a venue moved or removed a photo
                failed.append(f"{vid} ({p['kind']}): {e}")
                continue
            with torch.no_grad():
                f = unit(model.encode_image(preprocess(img).unsqueeze(0).to(device))).cpu()[0]
            if (f @ detail_t.T).max() > (f @ venue_t.T).max():
                details.append(f"{vid} ({p['kind']}): {p['src']}")
            by_kind.setdefault(p["kind"], []).append(f)
            by_kind.setdefault("all", []).append(f)
        if by_kind:
            fingerprints[vid] = {k: unit(torch.stack(fs).mean(0)) for k, fs in by_kind.items() if k in WEIGHTS}
        print(f"{vid}: {sum(len(v) for k, v in by_kind.items() if k != 'all')} photos", file=sys.stderr)

    # Every photo here is "a wedding venue", so they all share a lot; without this, one generic bright-room photo
    # comes out close to everything and shows up on every page. Take out the average per kind so what's left is
    # what sets each venue apart.
    for k in WEIGHTS:
        have = [f[k] for f in fingerprints.values() if k in f]
        mean = torch.stack(have).mean(0)
        for f in fingerprints.values():
            if k in f:
                f[k] = unit(f[k] - mean)

    def alike(a, b):
        shared = [k for k in WEIGHTS if k in a and k in b]
        return sum(WEIGHTS[k] * float(a[k] @ b[k]) for k in shared) / sum(WEIGHTS[k] for k in shared)

    if len(fingerprints) < len(photos) * 0.8:  # most downloads failed: keep the old data/looks.js
        sys.exit(f"Only {len(fingerprints)} of {len(photos)} venues have photos; not writing data/looks.js.\n  " + "\n  ".join(failed[:10]))
    looks = {}
    for vid, fa in fingerprints.items():
        raw = {other: alike(fa, fb) for other, fb in fingerprints.items() if other != vid}
        lo, hi = min(raw.values()), max(raw.values())
        # 0-1 within this venue's list: 1 = its closest look-alike, 0 = its least alike
        looks[vid] = [[o, round((s - lo) / (hi - lo), 3)] for o, s in sorted(raw.items(), key=lambda x: -x[1])]

    out = ("// Built by tools/build_looks.py: for each venue, every other venue by how alike their photos look\n"
           f"// (image model {MODEL} / {PRETRAINED}). 1 = its closest look-alike, 0 = its least alike.\n"
           "window.LOOKS = " + json.dumps(looks, separators=(",", ":")) + ";\n")
    (ROOT / "data" / "looks.js").write_text(out)
    print(f"Wrote data/looks.js for {len(looks)} venues ({len(out) // 1024} KB)")
    if failed:
        print("\nCouldn't download (left out):\n  " + "\n  ".join(failed))
    if details:
        print("\nLook like detail shots, not the venue (consider swapping in data/photos.js):\n  " + "\n  ".join(details))


if __name__ == "__main__":
    main()
