"""Convert data/venues.csv into data/venues.js for the wireframe.

Run from the repo root:  python3 tools/build_data.py
Rules come from decisions.md.
"""
import csv, json, re

SRC = "data/venues.csv"
OUT = "data/venues.js"

# City fixes (decisions.md: inferred from description or supplied by user)
CITY = {
    "Southworth Hall": "Provo",
    "Utah Valley Convention Center": "Provo",
    "Provo Library Ballroom": "Provo",
    "Chillon Reception Center": "Springville",
    "Orion Event Venue": "Lindon",
    "Hobble Creek Event Center": "Springville",
    "TalonsCove": "Saratoga Springs",
    "River Bridge Event Center": "Spanish Fork",
}

# Styles tagged from the Description column (decisions.md, style tagging rules)
STYLES = {
    "Sleepy Ridge Golf Course": ["Luxury", "Outdoors"],
    "Stone Gate Event Center": ["Rustic", "Classic", "Modern"],
    "The White Shanty": ["Modern", "Rustic"],
    "White Willow Reception Center": ["Classic", "Rustic"],
    "Barbwire and Lace": ["Rustic", "Outdoors"],
    "Quiet Meadows Farms": ["Rustic", "Outdoors"],
    "Wadley Farms": ["Classic", "Luxury", "Rustic", "Outdoors"],
    "Northampton House": ["Classic"],
    "The Bright Building": ["Classic", "Modern"],
    "Copper Creek Event Center": ["Classic"],
    "The Startup Building": ["Modern", "Classic"],
    "Southworth Hall": ["Classic", "Rustic"],
    "Riverside Country Club": ["Luxury"],
    "Conrad Ranch": ["Classic", "Rustic", "Outdoors"],
    "The Blake": ["Modern", "Classic"],
    "Utah Valley Convention Center": ["Modern", "Luxury"],
    "Provo Marriott Hotel": ["Luxury"],
    "Provo Library Ballroom": ["Classic"],
    "Ivory Hall": ["Modern"],
    "Redford Conference Center": ["Luxury", "Rustic", "Outdoors"],
    "The Rehearsal Hall": ["Modern", "Luxury"],
    "Grove Station": ["Modern"],
    "The Bungalow Event Venue": ["Classic", "Luxury"],
    "The Villa at the Retreat": ["Luxury", "Outdoors"],
    "Wild Oak Venue": ["Modern"],
    "Walker Farms": ["Classic", "Modern", "Rustic", "Outdoors"],
    "Orion Event Venue": ["Modern", "Classic"],
    "Castle Park": ["Luxury"],
    "Big Willow Barn": ["Rustic", "Outdoors"],
    "Sun River Gardens": ["Outdoors"],
    "Shade Home and Garden": ["Outdoors", "Modern"],
    "Barteli Event Venue": ["Classic"],
    "Rooftop Venue": ["Modern", "Luxury"],
    "The Lodge at Traverse Mountain": ["Rustic"],
    "Alpine Art Center": ["Classic", "Outdoors"],
    "Knot and Pine": ["Classic", "Rustic", "Modern"],
    "Springville Museum of Art": ["Classic"],
    "Willow Springs Event Center": ["Modern"],
    "Hobble Creek Event Center": ["Outdoors"],
    "Northridge Valley Event Center": ["Modern", "Classic"],
    "River Bridge Event Center": ["Classic"],
    "The Oaks at Spanish Fork": ["Modern"],
    "Maplewood Events": ["Modern"],
    "Chillon Reception Center": ["Luxury", "Classic"],
    "Emerald Eve Events": ["Rustic", "Modern"],
    "TalonsCove": ["Luxury", "Outdoors"],
}

# Decor items: (sub-category, label, regex). Matched against included text and rental text separately.
DECOR = [
    ("Specialty stations", "Cake table", r"cake table|cake stand"),
    ("Specialty stations", "Sweetheart table", r"sweetheart table"),
    ("Specialty stations", "Drink / beverage station", r"\bbar\b|drink|beverage|soda shop"),
    ("Specialty stations", "Photo booth / backdrop", r"photo booth|photo backdrop|photo wall|picture perfect"),
    ("Specialty stations", "Firepit", r"firepit|fire pit"),
    ("Specialty stations", "Piano", r"piano"),
    ("Aesthetics", "Ceremony arch / backdrop", r"\barch(es)?\b|backdrop|boxwood wall|slat wall"),
    ("Aesthetics", "Centerpieces", r"centerpiece"),
    ("Aesthetics", "Greenery / florals", r"greenery|floral|garland|potted plants|boxwood|vases"),
    ("Aesthetics", "Signs / easels", r"easel|sign\b|signs|sign stand|welcome"),
    ("Aesthetics", "Draping / chair covers", r"draping|drapery|chair cover|curtain"),
    ("Aesthetics", "Fireplace", r"fireplace"),
    ("Lighting items", "String / bistro lights", r"string|bistro lighting|cafe lights|canopy of lights|patio lights|fairy|pre-hung lighting|outdoor lighting|lights"),
    ("Lighting items", "Chandeliers", r"chandelier"),
    ("Lighting items", "Candles / lanterns", r"candle|lantern|votive"),
]


def lines(s):
    return [l.strip() for l in (s or "").split("\n") if l.strip()]


def money(s):
    return [int(x.replace(",", "")) for x in re.findall(r"\$([\d,]+)", s or "")]


def nums(s):
    return [int(x.replace(",", "")) for x in re.findall(r"\d[\d,]*", s or "")]


def has(text, pat):
    return re.search(pat, text or "", re.I) is not None


def decor(r):
    incl_text = " | ".join(lines(r["Other Decor Included"]) + [l for l in lines(r["extras"]) if "$" not in l])
    rent_text = " | ".join(lines(r["Other Decor for Rent"]) + [l for l in lines(r["extras"]) if "$" in l])
    out = {}
    for _, label, pat in DECOR:
        modes = []
        if has(incl_text, pat):
            modes.append("included")
        if has(rent_text, pat):
            modes.append("rent")
        if modes:
            out[label] = modes
    return out


def build(r):
    name = r["Venue Name"].strip()
    prices = money(r["Standard Price Range"])
    seated = nums(r["Seated Capacity"])
    standing = nums(r["Standing Capacity"])
    io = r["outside/inside"].strip().lower()
    av_text = " ".join([r["sound system"], r["extras"], r["Other Decor Included"]])
    access = r["Accessibility"]
    rooms = r["Bride/Groom Rooms"]
    coord = lines(r["Event Coordinator"])
    parking = r["parking?"]
    cleanup = r["cleanup crew"].strip().lower()
    return {
        "id": re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-"),
        "name": name,
        "city": CITY.get(name, r["City"].strip()),
        "description": r["Description"].strip(),
        "styles": STYLES[name],
        "priceMin": min(prices) if prices else None,
        "priceMax": max(prices) if prices else None,
        "priceText": r["Standard Price Range"].strip(),
        "seated": max(seated) if seated else None,
        "seatedText": r["Seated Capacity"].strip(),
        "standing": max(standing) if standing else None,
        "standingText": r["Standing Capacity"].strip(),
        "decor": decor(r),
        "av": {
            "Microphone": has(av_text, r"microphone"),
            "TV": has(av_text, r"\bTVs?\b|television|HD displays|TV screen"),
            "Sound system": r["sound system"].strip().lower().startswith("yes"),
            "Projector": has(av_text, r"projector|projection"),
        },
        "access": {
            "Wheelchair accessible": has(access, r"wheelchair|handicap"),
            "Elevator": has(access, r"elevator"),
            "ADA restrooms": has(access, r"ADA"),
            "Accessible parking": has(access, r"accessible parking"),
        },
        "flags": {
            "Designated lot": bool(parking.strip()) and not has(parking, r"stated on the official site")
                              and has(parking, r"lot|stall|spaces|spots|private|onsite|on-site|ample|across|expanded|upper"),
            "Linens included": r["Linens Included"].strip().upper() == "TRUE",
            "Indoors": io in ("inside", "both"),
            "Outdoors": io in ("outside", "both"),
            "Sparklers allowed": r["sparklers allowed"].strip().lower().startswith("yes"),
            "Cleanup crew": cleanup.startswith("included"),
            "Outside catering allowed": has(r["Catering"], r"outside caterer|outside vendor|any vendor|open vendor|own caterer|own vendors|self-cater|third-party|user-provided|food trucks")
                                        and not has(r["Catering"], r"outside caterer policy not stated"),
            "Bridal room": has(rooms, r"bride|bridal"),
            "Groom's room": has(rooms, r"groom"),
            "Event coordinator": any("$" not in l for l in coord),
        },
        # Every CSV field, for the "All details" section on the venue page
        "raw": {k: v.strip() for k, v in r.items() if k and v and v.strip()},
    }


rows = [r for r in csv.DictReader(open(SRC, encoding="utf-8")) if r["Venue Name"].strip()]
venues = [build(r) for r in rows]
decor_cats = {}
for cat, label, _ in DECOR:
    decor_cats.setdefault(cat, []).append(label)

with open(OUT, "w", encoding="utf-8") as f:
    f.write("// Generated by tools/build_data.py from data/venues.csv. Do not edit by hand.\n")
    f.write("window.VENUES = " + json.dumps(venues, indent=1, ensure_ascii=False) + ";\n")
    f.write("window.DECOR_CATEGORIES = " + json.dumps(decor_cats, indent=1) + ";\n")
print(f"Wrote {len(venues)} venues to {OUT}")
