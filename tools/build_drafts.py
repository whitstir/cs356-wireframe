"""Build prototype-drafts/index.html (drafts A/B/C) and prototype-drafts/combined.html.

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


# ---------- combined prototype (draft A + B's Undo, search every field) ----------
# Search must match every field that has content (team answer Q4) and never a blank one,
# so each venue carries [label, text] for every CSV column with real information.
FIELD_LABELS = [
    ("Venue Name", "Name"), ("Description", "Description"), ("City", "City"), ("Full Address", "Address"),
    ("Style", "Style words"), ("Standard Price Range", "Price range"), ("Packages and Prices", "Packages & prices"),
    ("Seated Capacity", "Seated capacity"), ("Standing Capacity", "Standing capacity"), ("Time slots", "Time slots"),
    ("Length of Rental", "Rental length"), ("outside/inside", "Indoor / outdoor"), ("Linens Included", "Linens"),
    ("Other Decor Included", "Decor included"), ("Other Decor for Rent", "Decor for rent"), ("extras", "Extras"),
    ("sound system", "Sound / AV"), ("Accessibility", "Accessibility"), ("parking?", "Parking"),
    ("cleanup crew", "Cleanup"), ("Event Coordinator", "Event coordinator"), ("Bride/Groom Rooms", "Bride & groom rooms"),
    ("Catering", "Catering"), ("Prep Area", "Prep area"), ("Alcohol policy", "Alcohol policy"),
    ("sparklers allowed", "Sparklers"), ("Deposit Policy", "Deposit"), ("Restrictions", "Restrictions"),
    ("Important Notes", "Notes"), ("Contact Information", "Contact"),
]
NO_INFO = {"", "false", "no", "none", "n/a", "na", "-"}


def has_info(text):
    t = text.strip().lower()
    return t not in NO_INFO and "not stated" not in t and "stated on the" not in t and "no pricing information" not in t


combined = []
for v in venues:
    out = {k: v[k] for k in ("id", "name", "city", "description", "styles", "priceMin", "priceMax",
                             "priceText", "seated", "seatedText", "standing", "standingText",
                             "decor", "av", "access")}
    out["flags"] = {k: b for k, b in v["flags"].items() if k != "Designated lot"}  # D4
    fields = []
    for raw_key, label in FIELD_LABELS:
        val = (v["raw"].get(raw_key) or "").strip()
        if val.upper() == "TRUE":
            val = "Included" if raw_key == "Linens Included" else "Yes"
        if has_info(val):
            fields.append([label, val])
    out["fields"] = fields
    link = (v["raw"].get("link") or "").strip()
    if link:
        out["link"] = link
    combined.append(out)

ctemplate = (ROOT / "prototype-drafts" / "combined-template.html").read_text()
chtml = ctemplate.replace("/*__VENUE_DATA__*/[]", json.dumps(combined, separators=(",", ":"), ensure_ascii=False))
(ROOT / "prototype-drafts" / "combined.html").write_text(chtml)
print(f"Wrote prototype-drafts/combined.html with {len(combined)} venues ({len(chtml) // 1024} KB)")
