"""Build the site's venue data from the team's sheet tabs.

Run from the repo root:  python3 tools/build_data.py
Reads   data/venues.csv          (Google Sheet tab "Venues": one row per venue, one column per filter)
        data/venue-sections.csv  (tab "Venue sections": venue-specific sections, one row per item)
Writes  data/venues.js           (what the site loads)
        data/venues/<id>.json    (one file per venue: core fields, filters, ordered page sections)

Filters are explicit: each "<Group>: <Option>" cell is blank (no) or starts with
"Included:", "Add-on:", "For rent:" or "Included + for rent:", followed by the venue's own wording.
Rules come from decisions.md and data/audit/README.md (team decisions 2026-10-27).
The build stops with an error if a filter has no home section or an ON filter has no wording.
"""
import csv, json, os, re, sys

SRC = "data/venues.csv"
SECTIONS_SRC = "data/venue-sections.csv"
OUT = "data/venues.js"
OUT_DIR = "data/venues"

# Styles by Venue ID (decisions.md, style tagging rules). Suggested changes are in data/audit/STYLE-SUGGESTIONS.md, not applied.
STYLES = {
    "sleepy-ridge-golf-course": ["Luxury", "Outdoors"],
    "the-white-shanty": ["Modern", "Rustic"],
    "white-willow-reception-center": ["Classic", "Rustic"],
    "barbwire-and-lace": ["Rustic", "Outdoors"],
    "quiet-meadows-farms": ["Rustic", "Outdoors"],
    "wadley-farms": ["Classic", "Luxury", "Rustic", "Outdoors"],
    "northampton-house": ["Classic"],
    "the-bright-building": ["Classic", "Modern"],
    "copper-creek-event-center": ["Classic"],
    "the-startup-building": ["Modern", "Classic"],
    "southworth-hall": ["Classic", "Rustic"],
    "riverside-country-club": ["Luxury"],
    "conrad-ranch": ["Classic", "Rustic", "Outdoors"],
    "the-blake": ["Modern", "Classic"],
    "utah-valley-convention-center": ["Modern", "Luxury"],
    "provo-marriott-hotel": ["Luxury"],
    "provo-library-ballroom": ["Classic"],
    "ivory-hall": ["Modern"],
    "redford-conference-center": ["Luxury", "Rustic", "Outdoors"],
    "the-rehearsal-hall": ["Modern", "Luxury"],
    "grove-station": ["Modern"],
    "the-bungalow-event-venue": ["Classic", "Luxury"],
    "wild-oak-venue": ["Modern"],
    "walker-farms": ["Classic", "Modern", "Rustic", "Outdoors"],
    "orion-event-venue": ["Modern", "Classic"],
    "castle-park": ["Luxury"],
    "big-willow-barn": ["Rustic", "Outdoors"],
    "sun-river-gardens": ["Outdoors"],
    "shade-home-and-garden": ["Outdoors", "Modern"],
    "barteli-event-venue": ["Classic"],
    "rooftop-venue": ["Modern", "Luxury"],
    "the-lodge-at-traverse-mountain": ["Rustic"],
    "alpine-art-center": ["Classic", "Outdoors"],
    "knot-and-pine": ["Classic", "Rustic", "Modern"],
    "springville-museum-of-art": ["Classic"],
    "willow-springs-event-center": ["Modern"],
    "hobble-creek-event-center": ["Outdoors"],
    "northridge-valley-event-center": ["Modern", "Classic"],
    "river-bridge-event-center": ["Classic"],
    "the-oaks-at-spanish-fork": ["Modern"],
    "maplewood-events": ["Modern"],
    "chillon-reception-center": ["Luxury", "Classic"],
    "emerald-eve-events": ["Rustic", "Modern"],
    "talonscove": ["Luxury", "Outdoors"],
}

# Every Explore filter option, by group, in sheet column order
FILTERS = {
    "Accessibility options": ["Wheelchair accessible", "Elevator", "ADA restrooms", "Accessible parking"],
    "Audio/Visual": ["Microphone", "Projector", "Sound system", "TV"],
    "Features": ["Bridal room", "Cleanup crew", "Event coordinator", "Groom's room", "Indoors",
                 "Linens included", "Outdoors", "Outside catering allowed", "Sparklers allowed"],
    "Decor": ["Centerpieces", "Ceremony arch / backdrop", "Draping / chair covers", "Fireplace", "Greenery / florals",
              "Signs / easels", "Candles / lanterns", "Chandeliers", "String / bistro lights"],
    "Other": ["Cake table", "Drink / beverage station", "Firepit", "Photo booth / backdrop", "Piano", "Sweetheart table"],
}
DECOR_CATEGORIES = {
    "Aesthetics": ["Ceremony arch / backdrop", "Centerpieces", "Greenery / florals", "Signs / easels", "Draping / chair covers", "Fireplace"],
    "Lighting items": ["String / bistro lights", "Chandeliers", "Candles / lanterns"],
    "Specialty stations": ["Cake table", "Sweetheart table", "Drink / beverage station", "Photo booth / backdrop", "Firepit", "Piano"],
}
# Paid add-ons switch the filter on only for these (team decisions 2 and 3)
ADDON_COUNTS = {"Event coordinator", "Sparklers allowed"}

# Venue page sections, in order (data/audit/STAGE3-DESIGN.md). Each filter option has exactly one home.
SECTIONS = [
    ("overview", "Overview", []),
    ("pricing", "Pricing", []),
    ("capacity", "Capacity & spaces", [("Features", "Indoors"), ("Features", "Outdoors")]),
    ("rooms", "Getting ready", [("Features", "Bridal room"), ("Features", "Groom's room")]),
    ("included", "What's included", [("Features", "Linens included"), ("Features", "Cleanup crew"), ("Features", "Event coordinator")]),
    ("av", "Audio / visual", [("Audio/Visual", o) for o in FILTERS["Audio/Visual"]]),
    ("decor", "Decor", [("Decor", o) for o in FILTERS["Decor"]]),
    ("other", "Other items", [("Other", o) for o in FILTERS["Other"]]),
    ("food", "Food & drink", [("Features", "Outside catering allowed")]),
    ("rules", "Rules & policies", [("Features", "Sparklers allowed")]),
    ("access", "Accessibility & parking", [("Accessibility options", o) for o in FILTERS["Accessibility options"]]),
    ("notes", "Good to know", []),
    ("contact", "Contact", []),
]
# Sheet columns shown as detail rows in each section (after the filter items)
SECTION_FIELDS = {
    "overview": ["Description", "Full Address", "Style"],
    "pricing": ["Standard Price Range", "Packages and Prices", "Deposit Policy"],
    "capacity": ["Seated Capacity", "Standing Capacity"],
    "rooms": ["Bride/Groom Rooms"],
    "included": ["Other Decor Included", "Event Coordinator", "cleanup crew"],
    "av": ["sound system"],
    "decor": ["Other Decor for Rent", "extras"],
    "food": ["Catering", "Prep Area", "Alcohol policy"],
    "rules": ["sparklers allowed", "Time slots", "Length of Rental", "Restrictions"],
    "access": ["Accessibility", "parking?"],
    "notes": ["Important Notes"],
    "contact": ["Contact Information", "link"],
}
FIELD_LABELS = {
    "Description": "Description", "Full Address": "Address", "Style": "Style words",
    "Standard Price Range": "Price", "Packages and Prices": "Packages & add-ons", "Deposit Policy": "Deposit",
    "Seated Capacity": "Seated", "Standing Capacity": "Standing", "Bride/Groom Rooms": "Rooms",
    "Other Decor Included": "Included items", "Event Coordinator": "Staff & coordination", "cleanup crew": "Setup & cleanup",
    "sound system": "Equipment", "Other Decor for Rent": "For rent", "extras": "Extras",
    "Catering": "Catering", "Prep Area": "Kitchen / prep", "Alcohol policy": "Alcohol",
    "sparklers allowed": "Sparklers", "Time slots": "Times", "Length of Rental": "Rental length", "Restrictions": "Restrictions",
    "Accessibility": "Accessibility", "parking?": "Parking", "Important Notes": "Notes",
    "Contact Information": "Contact", "link": "Website",
}
PREFIXES = [("Included + for rent", "included+rent"), ("Included", "included"), ("Add-on", "addon"), ("For rent", "rent")]


def fail(msg):
    sys.exit(f"build_data.py: {msg}")


def lines(s):
    return [l.strip() for l in (s or "").split("\n") if l.strip()]


def num(s):
    s = (s or "").replace(",", "").replace("$", "").strip()
    return int(float(s)) if s else None


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def parse_filter(cell, where):
    """'Included: Bridal Suite' -> ('included', 'Bridal Suite'); blank -> ('no', '')."""
    cell = (cell or "").strip()
    if not cell:
        return "no", ""
    for label, status in PREFIXES:
        if cell.lower().startswith(label.lower() + ":"):
            wording = cell[len(label) + 1:].strip()
            if not wording:
                fail(f"{where}: '{label}:' needs the venue's wording after it")
            return status, wording
    fail(f"{where}: cell must start with Included:, Add-on:, For rent: or Included + for rent: (got {cell[:40]!r})")


# Check the section map once: every filter option has exactly one home section
homes = [fo for _, _, fos in SECTIONS for fo in fos]
for g, opts in FILTERS.items():
    for o in opts:
        if homes.count((g, o)) != 1:
            fail(f"filter '{g} > {o}' must have exactly one home section (has {homes.count((g, o))})")


def build(r, extras):
    vid = r["Venue ID"].strip() or slug(r["Venue Name"])
    name = r["Venue Name"].strip()
    filters = {}
    for g, opts in FILTERS.items():
        for o in opts:
            filters[f"{g} > {o}"] = dict(zip(("status", "wording"), parse_filter(r.get(f"{g}: {o}"), f"{name} / {g}: {o}")))
    on = lambda g, o: filters[f"{g} > {o}"]["status"] in (("included", "addon") if o in ADDON_COUNTS else ("included",))

    # Ordered page sections: filter items first (anchor ids for deep links), then the sheet's detail rows,
    # with venue-specific sections placed after the section named in "Place After".
    sections = []
    for sid, title, fos in SECTIONS:
        items = []
        for g, o in fos:
            f = filters[f"{g} > {o}"]
            items.append({"id": f"{sid}-{slug(o)}", "label": o, "filter": f"{g} > {o}", "status": f["status"],
                          "value": f["wording"] or "Not listed by the venue"})
        for k in SECTION_FIELDS.get(sid, []):
            if (r.get(k) or "").strip():
                items.append({"id": f"{sid}-{slug(FIELD_LABELS[k])}", "label": FIELD_LABELS[k], "value": r[k].strip()})
        if items:
            sections.append({"id": sid, "title": title, "filters": [f"{g} > {o}" for g, o in fos], "items": items})
        for title2, rows in extras.get(sid, {}).items():
            sections.append({"id": slug(title2), "title": title2, "filters": [], "venueSpecific": True,
                             "items": [{"id": f"{slug(title2)}-{i}", "label": x["Label"], "value": x["Value"]} for i, x in enumerate(rows)]})

    pl, ph, sl, sh = num(r["Price Low"]), num(r["Price High"]), num(r["Seated Low"]), num(r["Seated High"])
    return {
        "id": vid,
        "name": name,
        "city": r["City"].strip(),
        "description": r["Description"].strip(),
        "styles": STYLES.get(vid, []),
        "priceMin": pl,
        "priceMax": ph,
        "priceBasis": r["Price Basis"].strip(),
        "priceText": r["Standard Price Range"].strip(),
        "seated": sh,
        "seatedMin": sl,
        "seatedText": r["Seated Capacity"].strip(),
        "standing": num(r["Standing High"]),
        "standingMin": num(r["Standing Low"]),
        "standingText": r["Standing Capacity"].strip(),
        "decor": {o: {"included": ["included"], "rent": ["rent"], "included+rent": ["included", "rent"]}[f["status"]]
                  for g in ("Decor", "Other") for o in FILTERS[g]
                  if (f := filters[f"{g} > {o}"])["status"] in ("included", "rent", "included+rent")},
        "av": {o: on("Audio/Visual", o) for o in FILTERS["Audio/Visual"]},
        "access": {o: on("Accessibility options", o) for o in FILTERS["Accessibility options"]},
        "flags": {**{o: on("Features", o) for o in FILTERS["Features"]},
                  "Designated lot": bool(re.search(r"lot|stall|spaces|spots|garage|onsite|on-site|ample|private", r.get("parking?") or "", re.I))},
        "filters": filters,
        "sections": sections,
        # Every sheet field, for search and the "Detailed information" block
        "raw": {k: v.strip() for k, v in r.items() if k and v and v.strip() and ":" not in k},
    }


rows = [r for r in csv.DictReader(open(SRC, encoding="utf-8")) if r["Venue Name"].strip()]
extras = {}
if os.path.exists(SECTIONS_SRC):
    for x in csv.DictReader(open(SECTIONS_SRC, encoding="utf-8")):
        place = x["Place After"].strip() or "notes"
        if place not in {s[0] for s in SECTIONS}:
            fail(f"venue-sections.csv: '{x['Section']}' has unknown Place After '{place}'")
        extras.setdefault(x["Venue ID"].strip(), {}).setdefault(place, {}).setdefault(x["Section"].strip(), []).append(x)
venues = [build(r, extras.get(r["Venue ID"].strip(), {})) for r in rows]
ids = [v["id"] for v in venues]
if len(set(ids)) != len(ids):
    fail("duplicate Venue ID")
for vid in set(extras) - set(ids):
    fail(f"venue-sections.csv mentions unknown Venue ID '{vid}'")
for v in venues:
    if not v["styles"]:
        print(f"warning: {v['name']} has no style tags (add its Venue ID to STYLES)")

os.makedirs(OUT_DIR, exist_ok=True)
for f in os.listdir(OUT_DIR):
    if f.endswith(".json") and f[:-5] not in ids:
        os.remove(os.path.join(OUT_DIR, f))
for v in venues:
    with open(os.path.join(OUT_DIR, v["id"] + ".json"), "w", encoding="utf-8") as f:
        json.dump(v, f, indent=1, ensure_ascii=False)
with open(OUT, "w", encoding="utf-8") as f:
    f.write("// Generated by tools/build_data.py from data/venues.csv and data/venue-sections.csv. Do not edit by hand.\n")
    f.write("window.VENUES = " + json.dumps(venues, indent=1, ensure_ascii=False) + ";\n")
    f.write("window.DECOR_CATEGORIES = " + json.dumps(DECOR_CATEGORIES, indent=1) + ";\n")
print(f"Wrote {len(venues)} venues to {OUT} and {OUT_DIR}/")
