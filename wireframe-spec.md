# Utah County Wedding Venues — Wireframe Specification

Final build spec for the wireframe and tree-test instrument. Assignment requirements are in [specs.md](specs.md); the reasoning behind each choice is in [decisions.md](decisions.md).

**Live URL:** https://whitstir.github.io/cs356-wireframe/

| Page | URL |
|---|---|
| Normal site | `https://whitstir.github.io/cs356-wireframe/` |
| Start a test (one per participant) | `https://whitstir.github.io/cs356-wireframe/?test` |
| Results (view, download CSV/JSON, clear) | `https://whitstir.github.io/cs356-wireframe/?results` |
| Click log (normal browsing) | `https://whitstir.github.io/cs356-wireframe/#/log` |

---

## 1. Visual rules (wireframe fidelity)
- Black and white only. One font (system sans-serif), one size scale. No color, images, icons, bold-for-decoration, or typographic styling.
- Generic boxes: 1px black borders, white backgrounds, consistent spacing. No hover fill.
- Hierarchy comes from layout alone: position, box nesting, whitespace, and plain text headings.
- Works at phone width with no horizontal scroll.

## 2. Content: information blocks
- **46 venues** from `data/venues.csv`. Each venue is a leaf (information block) with its own endpoint page.
- `tools/build_data.py` converts the CSV into `data/venues.js`. Re-run it after editing the CSV.
- Data rules (price range overlap, max seated capacity, blank = no, included-only checkboxes, etc.) are listed in decisions.md → Data rules.

## 3. Information architecture

### Categorization 1 — Global navigation: *where* and *what kind*
```
Home
├── Location ▾ ── [City] ── Explore (city pre-set) ── [Venue]
├── Style ▾ ───── [Rustic | Luxury | Modern | Outdoors | Classic] ── Explore (style pre-set) ── [Venue]
└── Explore ───── (filter page) ── [Venue]
```
- **Location** dropdown: 15 cities (Alpine, American Fork, Carriere, Concord, Lehi, Lindon, Mapleton, Orem, Pleasant Grove, Provo, Riverton, Saratoga Springs, Spanish Fork, Springville, Sundance). Choosing one opens Explore with that city selected; users can keep refining.
- **Style** dropdown: 5 styles. Choosing one opens Explore with that style checked. A venue can appear under several styles.
- Every venue is reachable through Location, Style (each venue has at least one style), and Explore.

### Categorization 2 — Explore page: *by feature* (faceted filters)
Left column = local navigation. At widths 640px and up it sticks in place and scrolls on its own, so results stay visible; below 640px it stacks on top. Right column = live results ("Showing N venues").

| Filter | Control | Match rule |
|---|---|---|
| Price | Two-handle range slider, $0 – $10k+ | Venue price range overlaps the slider. Unpriced venues hidden once moved. |
| Capacity (seated) | Two-handle range slider, 0 – 1000+ | Max seated capacity in range. Blank hidden once moved. |
| Style | Checkboxes | ANY checked |
| City | Dropdown | Exact |
| Decor ▸ | Expandable. "Included" / "For rent" toggles, then 3 sub-groups of item checkboxes | ALL checked items, in any checked mode |
| Audio/Visual ▸ | Expandable checkboxes: Microphone, TV, Sound system, Projector | ALL |
| Accessibility options ▸ | Expandable checkboxes: Wheelchair accessible, Elevator, ADA restrooms, Accessible parking | ALL |
| Parking | Checkbox: Designated lot | — |
| Features | Checkboxes: Linens included, Indoors, Outdoors, Sparklers allowed, Cleanup crew, Outside catering allowed, Bridal room, Groom's room, Event coordinator | ALL |

Decor sub-groups:
- **Specialty stations:** Cake table, Sweetheart table, Drink / beverage station, Photo booth / backdrop, Firepit, Piano
- **Aesthetics:** Ceremony arch / backdrop, Centerpieces, Greenery / florals, Signs / easels, Draping / chair covers, Fireplace
- **Lighting items:** String / bistro lights, Chandeliers, Candles / lanterns

A "Clear all filters" button resets everything. Filter state is kept in the URL hash, so carousel links can pre-set it.

### Landing page
- Short intro line, then a horizontally scrolling carousel of 3 boxes (with ‹ › buttons):
  - **Budget venues** → Explore, price $0 – $2,000
  - **Spacious venues** → Explore, capacity 200+
  - **Open catering** → Explore, Outside catering allowed checked

## 4. Pages
| Route | Content |
|---|---|
| `#/` | Landing page with carousel |
| `#/explore?…` | Filter page |
| `#/venue/<id>` | **Endpoint.** Line reading "End of path: [Venue name]". Summary box: name, city, website link, description, price, seated + standing capacity, styles, key features. Below it, an expandable "All details" section with every CSV field, grouped (Pricing & packages, Capacity & time, Space & decor, Services, Policies, Contact) and empty fields hidden. |
| `#/log` | Click log: table, Download JSON, Download CSV, Copy, Clear |

Venue list boxes show: name, city, price text, seated capacity, styles. Each box is a link to the endpoint.

## 5. Click recording (always on)
- Every click on a link, button, checkbox, slider, dropdown or summary is logged: timestamp, page (route), element type, element label, and resulting route.
- Stored in `localStorage`. Viewable and exportable at `#/log` as JSON or CSV, or by copying to the clipboard.
- A small footer link "Click log" is on every page outside test mode.

## 6. Tree test mode (`?test`)
Based on the course Tree Test spec.

**Flow**
1. Start screen: enter a participant ID. Text reminds them: *"We are testing the website's structure, not you. Pressing 'I would give up' is a useful result, not a failure. Please think aloud."*
2. The 10 tasks are shuffled independently for each participant.
3. For each task, a scenario box appears with **OK, start**. The site loads at Home and the timer starts on OK.
4. Every click is recorded. A fixed bar at the top shows the task text, task number (e.g., 3 / 10), and an **I would give up** button.
5. The task ends when the participant **reaches any venue endpoint** (recorded as the finish block) or presses **I would give up**. The next task starts.
6. After task 10, a thank-you screen appears. Results are saved.

The footer "Click log" link is hidden during a test. There is no search box anywhere on the site.

**Logged per task** (one row per participant × task):

| Field | Meaning |
|---|---|
| participant | ID entered at start |
| session_start | ISO timestamp |
| task_id | T1–T10 |
| task_order | position 1–10 for this participant |
| task_text | scenario shown |
| target | correct venue |
| outcome | `success` / `fail` (wrong venue) / `gave_up` |
| finish_block | venue reached, or blank if gave up |
| first_click | label of the first click after OK |
| first_click_expected | predicted first click |
| click_path | every click label, separated by ` > ` |
| click_count | number of clicks |
| backtracks | times the participant returned to a page already visited (directness) |
| elapsed_ms | from OK to finish or give-up |

**Results (`?results`)**: summary table per task (success %, give-up %, median time, most common first click) plus the raw rows. Buttons: Download CSV, Download JSON, Clear all (asks to confirm). Results persist in this browser's `localStorage`, so **run every session on the same device and browser**, and export after each study day.

## 7. Task scenarios
**Status:** draft only. `data/tasks.js` has 10 blank slots (T1–T10). Test mode skips blank tasks and shows a "no scenarios set up" screen until they're filled in. Each slot takes `text`, `target` (venue id or exact name), and `expectedFirstClick`.

Written in the user's words, with no category labels quoted. Each task has exactly one correct venue under the current data (checked by script).

| ID | Scenario | Target | Predicted first click | Likely paths |
|---|---|---|---|---|
| T1 | You love the idea of guests roasting s'mores around a fire after dinner. Find a venue that can make that happen. | The White Shanty | Explore | Explore › Decor › Firepit |
| T2 | Your grandmother uses a wheelchair and can't manage stairs. Find a venue where she can get around easily. | Copper Creek Event Center | Explore | Explore › Accessibility › Wheelchair + Elevator |
| T3 | Your family is huge — about 800 people will sit down for dinner. Find a venue big enough. | Utah Valley Convention Center | Explore (or Spacious tile) | Explore › Capacity slider |
| T4 | You can only spend about $1,000 on the venue, but you're inviting 300 guests to a sit-down dinner. Find a venue that works. | Provo Library Ballroom | Explore (or Budget tile) | Explore › Price + Capacity |
| T5 | You're getting married in Alpine and want to play a slideshow of photos from when you were kids. Find a venue that can do it. | Alpine Art Center | Explore | Explore › City + A/V › Projector; or Location › Alpine |
| T6 | You want a barn-style reception in Pleasant Grove that ends with a sparkler send-off. Find a venue. | Barbwire and Lace | Location | Location › Pleasant Grove; Style › Rustic; Explore |
| T7 | You want a sleek, contemporary reception in Lehi. Find a venue. | Rooftop Venue | Location | Location › Lehi; Style › Modern |
| T8 | You've always pictured a romantic, upscale reception in Spanish Fork. Find a venue. | The Bungalow Event Venue | Location | Location › Spanish Fork; Style › Luxury |
| T9 | Your aunt is catering the food, you don't want your family stuck cleaning up afterward, and you want the place to feel high-end. Find a venue. | Sleepy Ridge Golf Course | Explore (or Open catering tile) | Explore › Outside catering + Cleanup crew + Luxury |
| T10 | You're planning a reception in Mapleton. The bride and groom each need their own room to get ready, and you don't want to rent tablecloths. Find a venue. | Northridge Valley Event Center | Explore | Explore › City + Bridal room + Groom's room + Linens; or Location › Mapleton |

Coverage across the two categorizations: T6–T8 test the global nav (Location/Style). T1–T5, T9 and T10 test the Explore facets. T3, T4 and T9 can also be reached from the carousel.

## 8. File structure
```
index.html          single page; all views rendered by app.js
style.css           wireframe styles
app.js              router, views, filters, click log, test mode, results
data/venues.csv     source data
data/venues.js      generated by tools/build_data.py
tools/build_data.py CSV → venues.js
specs.md            assignment spec
decisions.md        decision log
wireframe-spec.md   this file
```
Hosted on GitHub Pages from `main` (root). No build step and no external libraries.
After changing CSS/JS/data, bump the `?v=` number on the four asset tags in `index.html` so browsers don't use cached copies.

## 9. Before running participants
- Do a full dry run with a teammate: run `?test`, complete all 10 tasks (including one give-up), open `?results`, download the CSV, and confirm a give-up is distinguishable from a wrong-venue finish.
- Don't show participants the category list beforehand, and don't answer "where is it" questions.
