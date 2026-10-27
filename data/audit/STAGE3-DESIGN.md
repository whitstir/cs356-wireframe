# Stage 3: how each venue page's data will be organized (proposal, not built yet)

Goals from the team:
- Every filter has a clear home in the venue page's ordered sections.
- Getting from a filter to the details behind it is one click.
- The team keeps editing a CSV / Google Sheet, and the JSON regenerates from it automatically.

## 1. Ordered sections

Every venue page uses the same order, and a section with nothing in it is left out. A venue's unique sections (lodging, rain plan, ceremony sites…) slot in at the position shown. That way each venue gets its own categories without breaking the order people learn.

| # | Section id | Title | Filters that live here | What else goes here |
|---|---|---|---|---|
| 1 | `overview` | Overview | **City**, **Style** | Description, address, website |
| 2 | `pricing` | Pricing | **Price** | Rate table (day / season / hours), packages, add-ons with prices, deposit and payment terms |
| 3 | `capacity` | Capacity & spaces | **Capacity (seated)**, **Indoors**, **Outdoors** | Seated / standing, capacity by layout, a table with one row per space or room |
|   | *(venue-specific)* | e.g. Ceremony sites, Rain plan | — | Only venues that have them |
| 4 | `rooms` | Getting ready | **Bridal room**, **Groom's room** | Suite and dressing room details |
| 5 | `included` | What's included | **Linens included**, **Cleanup crew**, **Event coordinator** | Tables and chairs, setup / takedown, staff on site |
| 6 | `av` | Audio / visual | **Microphone, Projector, Sound system, TV** | Equipment list; paid A/V shown with its price |
| 7 | `decor` | Decor | **all 9 Decor items** (with Included / For rent) | The included decor inventory and the decor rental list, each item tagged Included or For rent with its price |
| 8 | `other` | Other items | **all 6 Other items** (with Included / For rent) | Stations, piano, photo booth… |
| 9 | `food` | Food & drink | **Outside catering allowed** | Catering policy, preferred or required caterers, kitchen / prep area, alcohol policy |
|   | *(venue-specific)* | e.g. Catering menu | — | |
| 10 | `rules` | Rules & policies | **Sparklers allowed** | Restrictions, time slots and rental length, cancellation |
| 11 | `access` | Accessibility & parking | **all 4 Accessibility options** | Parking details (the old Parking filter, D4) |
|   | *(venue-specific)* | e.g. On-site lodging, Photo shoots | — | |
| 12 | `notes` | Good to know | — | Important notes, conflicts the venue's own site hasn't settled ("Ask on your tour") |
| 13 | `contact` | Contact | — | Phone, email, website, "last checked" date and source pages |

**Check: every filter has exactly one home section.** That's the 2 sliders, City, the 5 Styles and all 32 checkboxes. The build will **fail with a clear message** if:
- a filter is on for a venue but its home section has no item backing it, or
- the evidence for a filter that is on points nowhere.

So a filter can never claim something the page doesn't show.

## 2. Getting from a filter to its details (clear and easy)

The data will support all of these. The design can choose which to show.

- **Each filter item has a stable anchor**, for example `#decor-chandeliers` or `#included-cleanup-crew`. On Explore, a filter chip or a venue card's matched-filter tag can link straight to that spot on the venue page.
- **Each section lists its filters at the top**, e.g. "Filters here: Linens included, Cleanup crew, Event coordinator". People see why the venue matched, and the labels are the same words as the Explore sidebar.
- **Every filter value carries its own one-line reason**, written from the site. For example, Cleanup crew → "Staff handle tables, chairs, linens and floors". This is what the Features checklist shows, replacing today's guess from free text.
- **When you arrive from Explore, the filters you searched are pre-highlighted**, e.g. `?from=filters&f=Sparklers allowed` highlights that item. This extends the search highlighting the site already has.
- **Paid add-ons sit next to the included items, marked "Add-on $X"**. A venue that sells sparklers as a $100 package then still shows up clearly on its page, even though the "Sparklers allowed" filter (included only) is off.

## 3. Data format: the team edits a sheet; JSON is generated

**Editable source (Google Sheet tabs, one CSV each in `data/`):**

| Tab / CSV | One row per | Columns |
|---|---|---|
| `venues.csv` (existing *Venues* tab) | venue | the 32 current columns plus `last_checked` and `source_pages` |
| `venue-spaces.csv` (new tab) | space or room | venue_id, space, seated, standing, setting (indoor / outdoor / both), notes |
| `venue-rates.csv` (new tab) | price line | venue_id, label, days, season, hours, price, kind (rental / package / add-on / per-person), includes |
| `venue-extras.csv` (new tab) | venue-specific item | venue_id, section (e.g. "Rain plan", "On-site lodging"), place_after (a section id from the table above), label, value |

Why these tabs: the auditors found that every venue's "different" information is one of three kinds:
- spaces (18 venues)
- prices broken down by day, season or package (most venues)
- a one-off section (lodging, rain plan, ceremony sites, menus…)

Long, narrow tabs are easy to edit in Sheets, and they hold any number of rows per venue.

**Generated (never edited by hand):**
- `data/venues/<id>.json`: one file per venue with `core` (the fields cards and filters use), `filters` (each option → value, mode, home section, anchor, reason) and `sections` (the ordered list above).
- `data/venues.js`: the same data in the shape the site reads today, so the current site keeps working until the design uses the new sections.

## 4. Regeneration rule (sheet change → JSON change)

1. **`tools/build_data.py` rebuilds everything** from the CSVs, and runs the completeness check from section 1.
2. **GitHub Action `.github/workflows/build-data.yml`** runs the build whenever any `data/*.csv` changes on `main` and commits the regenerated JSON. Nobody can push a CSV change and forget to rebuild.
3. **Optional automatic sync from Google Sheets:** a `tools/sync_sheet.py` step in the same Action. It downloads each tab as CSV on a schedule (e.g. hourly) and on demand, commits only if something changed, then rebuilds. It needs the sheet shared as "anyone with the link can view" (or published to the web) so the Action can read it without a password. **Team decision.** Without it, the flow is: edit the sheet → File > Download > CSV into `data/` → push, and the Action does the rest.

## 5. Order of work once the audit is approved

1. Apply your decisions to `data/audit/venues-proposed.csv`, then copy it to `data/venues.csv`. Rebuild the Venues tab of the Google Sheet from it (I'll give you the file to import).
2. Fix the keyword rules the audit flagged, or replace keyword guessing with explicit filter columns (see the question in the review summary).
3. Split `venue_sections` from the audit files into the three new tabs.
4. Write the generator, the completeness check and the Action. Rebuild, then check the site still loads and filters as before, and compare filter counts before and after.
