"""Build prototype-drafts/index.html from prototype-drafts/template.html.

Inlines a slimmed copy of data/venues.js so the drafts page is one self-contained
file (it can be opened locally or published as a single page).
Run from the repo root:  python3 tools/build_drafts.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
src = (ROOT / "data" / "venues.js").read_text()
venues = json.loads(src[src.index("["):src.rindex("]", 0, src.index("window.DECOR_CATEGORIES")) + 1])

KEEP_RAW = {
    "link": "link",
    "Full Address": "address",
    "parking?": "parking",
    "Time slots": "times",
    "Length of Rental": "length",
    "Catering": "catering",
    "Alcohol policy": "alcohol",
    "Restrictions": "restrictions",
    "Contact Information": "contact",
}

slim = []
for v in venues:
    flags = {k: b for k, b in v["flags"].items() if k != "Designated lot"}  # D4: parking filter removed
    out = {k: v[k] for k in ("id", "name", "city", "description", "styles", "priceMin", "priceMax",
                             "priceText", "seated", "seatedText", "standing", "standingText",
                             "decor", "av", "access")}
    out["flags"] = flags
    for raw_key, key in KEEP_RAW.items():
        val = (v["raw"].get(raw_key) or "").strip()
        if val:
            out[key] = val
    slim.append(out)

template = (ROOT / "prototype-drafts" / "template.html").read_text()
html = template.replace("/*__VENUE_DATA__*/[]", json.dumps(slim, separators=(",", ":"), ensure_ascii=False))
(ROOT / "prototype-drafts" / "index.html").write_text(html)
print(f"Wrote prototype-drafts/index.html with {len(slim)} venues ({len(html) // 1024} KB)")
