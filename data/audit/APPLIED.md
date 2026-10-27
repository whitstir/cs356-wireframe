# Team decisions applied locally (2026-10-27): review, then approve

Everything below is **local only**: nothing is committed or pushed, and the Google Sheet is unchanged.

## What changed

**Rows**
- 44 venues. Stone Gate (Concord, VA) and The Villa (Carriere, MS) are removed because they aren't in Utah County.

**Names** (decision 9: renamed to what each website calls itself)

| Old name | New name |
|---|---|
| Sleepy Ridge Golf Course | Sleepy Ridge Weddings |
| Barbwire and Lace | Barbwire & Lace |
| Quiet Meadows Farms | Quiet Meadow Farm |
| Provo Marriott Hotel | Provo Marriott Hotel & Conference Center |
| Ivory Hall | The Ivory Hall |
| The Rehearsal Hall | Rehearsal Hall |
| The Bungalow Event Venue | The Bungalow |
| Wild Oak Venue | The Wild Oak |
| Shade Home and Garden | Shade Weddings and Events |
| Barteli Event Venue | Barteli Reception Hall |
| Rooftop Venue | The Rooftop |
| Knot and Pine | Knot & Pine |
| Northridge Valley Event Center | Northridge Valley Wedding and Event Center |
| The Oaks at Spanish Fork | Event Center at The Oaks |
| Chillon Reception Center | The Chillon |
| Emerald Eve Events | Emerald Eve Event Center |

Page addresses and photos don't change, because each venue keeps its old `Venue ID`.

**Cities**
- Now 13: Salem and Saratoga Springs are new.
- Riverton, Carriere and Concord are gone.

**Filters (decision 1)**
- `data/venues.csv` now has **one column per filter** (32 columns, e.g. `Features: Bridal room`).
- Each cell is blank (no) or starts with `Included:`, `Add-on:`, `For rent:` or `Included + for rent:`, followed by the venue's own wording. That wording is shown on the venue page.
- Keyword guessing is gone from `tools/build_data.py`.

**Event coordinator (decision 2)**
- ON for 31 venues: any host, attendant, manager or coordinator who belongs to the venue, including paid ones (e.g. "Event Day Coordinator — $300").
- OFF where staff only handle booking, or where the planner is an outside or partner company.

**Sparklers (decision 3)**
- ON for 16 venues, including paid packages, with the price and conditions in the wording.

**Dressing rooms (decision 6)**
- Count as Bridal room and Groom's room. The wording keeps the venue's term ("2 Private Dressing Rooms").

**Capacity (decision 4)**
- Chair counts are used when that's all the site gives.
- Several numbers become a range (`Seated Low` / `Seated High`), e.g. The Rooftop 80–300.
- The Capacity filter now matches when the venue's range overlaps the slider, the same way price already worked.
- No number is published for 4 venues: Quiet Meadow Farm, Grove Station, Sun River Gardens and River Bridge.

**Price (decision 5)**
- `Price Low` / `Price High` / `Price Basis`.
- Per-person venues are multiplied by capacity, with the math shown:
  - Utah Valley Convention Center $15,102–$53,946
  - Provo Marriott $22,750–$48,750
- Full-service: The Chillon $4,999.
- Conflicting pages become ranges, e.g. Startup Building $1,350–$2,750 and Northridge $5,000–$7,000.
- Nothing published, so blank: Redford and Rehearsal Hall.

**Venue page sections**
- New tab `data/venue-sections.csv` holds 101 venue-specific sections (spaces, ceremony sites, rain plans, lodging, menus…). Each one names the standard section it follows (`Place After`).
- `tools/build_data.py` writes `data/venues/<id>.json` for each venue with the ordered sections. It stops with an error if any filter has no home section, or an ON filter has no wording.

**Hi-fi site (minimal changes, design untouched)**
- The Features checklist shows each filter's own wording.
- Every feature, plus the Decor, Other, Parking, Accessibility and A/V cards, has a **"More information"** link. It opens "Detailed information" and scrolls to that filter's row.
- "Detailed information" now follows the ordered sections.
- Seats and prices show as ranges.

**Styles**
- Not changed. Suggestions are in `STYLE-SUGGESTIONS.md`.

## Keeping the sheet in sync (decision 10)

- `tools/sync_sheet.py` **only reads** the Google Sheet. It downloads the *Venues* and *Venue sections* tabs into `data/` and rebuilds.
- It **refuses to write** while the sheet still has the old layout (no `Venue ID` column), so it can't undo these changes before you approve them.
- `.github/workflows/venue-data.yml` runs the sync **on demand**: *Actions → Venue data → Run workflow*. It also rebuilds whenever a CSV is pushed, and commits the generated files. It only starts working once it's committed and pushed.

## To approve

1. Review: `data/venues.csv`, `data/venue-sections.csv`, and the site at http://localhost:8356/site/ (preview server).
2. In the Google Sheet, *File → Import → Upload*:
   - `data/venues.csv` → **Replace current sheet** while on the *Venues* tab.
   - `data/venue-sections.csv` → **Insert new sheet**, then rename that tab exactly **Venue sections**.
3. Run `python3 tools/sync_sheet.py --check`. It should say "nothing" would change.
4. Commit and push. From then on, after editing the sheet, click *Run workflow* to update the site.

## How pass 2 was done

The auditors' second run hit the usage limit before writing anything. So pass 2 was generated from their verified audit data (`data/audit/venues/`) by a script, with the decision changes and ranges set by hand. That means it doesn't include fresh site visits; the wording is the evidence the auditors quoted in pass 1. The per-venue result is in `data/audit/pass2/`.
