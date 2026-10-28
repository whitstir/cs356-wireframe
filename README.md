# Utah County Wedding Venues — Wireframe (CS 356)

A black-and-white wireframe of a site that presents **wedding reception venues in Utah County**. It's built for the CS 356 Part 1 wireframe assignment, and it doubles as the **tree-test instrument** for Part 2 usability testing.

This README summarizes what the team has discussed and decided so far, so anyone opening the repo can catch up.

## Links

| What | URL |
|---|---|
| Live site | https://whitstir.github.io/cs356-wireframe/ |
| Hi-fi site (built from the Figma design, in [site/](site/)) | https://whitstir.github.io/cs356-wireframe/site/ |
| Hi-fi test mode / results / click log | https://whitstir.github.io/cs356-wireframe/site/?test · [?results](https://whitstir.github.io/cs356-wireframe/site/?results) · [#/log](https://whitstir.github.io/cs356-wireframe/site/#/log) |
| Start a tree test (one per participant) | https://whitstir.github.io/cs356-wireframe/?test |
| Tree-test results (view, download CSV/JSON, clear) | https://whitstir.github.io/cs356-wireframe/?results |
| Click log (normal browsing) | https://whitstir.github.io/cs356-wireframe/#/log |
| Repo | https://github.com/whitstir/cs356-wireframe |

## Where things are documented

| File | What's in it |
|---|---|
| [specs.md](specs.md) | The assignment as given: requirements, bonus test mode, what to turn in, and the 60-point rubric |
| [decisions.md](decisions.md) | Every decision made, numbered (1–28), plus data rules and the style tag for each venue |
| [wireframe-spec.md](wireframe-spec.md) | The build spec: information architecture, pages, filters, click log, test mode, and draft task scenarios |
| README.md → [Updating venue data](#updating-venue-data) | **How venue data gets from the Google Sheet to the site** (start here before changing any venue info) |
| [data/audit/](data/audit/) | How the venue data was checked against each venue's website (2026-10), and the team's data decisions |
| README.md | This summary |

If these disagree, **decisions.md** is the most up to date.

## Assignment in brief
From [specs.md](specs.md):
- **Wireframe fidelity:** black and white, one font, generic boxes, no images or styling.
- **Coverage:** every information block from the card sort is present, and each leaf has a clear end state.
- **Two categorizations:** two different ways to find the same blocks.
- **Hierarchy:** at least 2 levels, grounded in the card sort.
- **Interaction:** click-through navigation, plus click recording with an exportable JSON/CSV log.
- **Bonus test mode:** 10 randomized scenarios, timed, with results that persist.
- **Turn in:** the URL and a rationale paragraph.

The rubric is Functional 18, Visual 13, IA 13, and Grounded in previous study 16, for 60 points total.

## How the site is organized

**Information blocks (leaves):** 45 venues from the team's venue spreadsheet. Every venue has its own endpoint page that reads "You reached: [Venue]". The page shows a summary with name, city, website link, description, price, seated and standing capacity, styles, features, A/V, accessibility and decor. Below it, an expandable "All venue details" section holds every spreadsheet field, grouped, with empty fields hidden.

**Categorization 1 — global navigation (top of every page, plain links, no dropdowns):**
- **Location:** 15 cities, alphabetical. Each opens Explore filtered to that city.
- **Style:** Classic, Luxury, Modern, Outdoors, Rustic. Each opens Explore filtered to that style. A venue can have several styles.
- **Explore all venues:** opens the filter page with nothing selected.

**Categorization 2 — Explore page (faceted filters):**
- **Filter order:** Price is first, and the rest are alphabetical: Accessibility options, Audio/Visual, Capacity (seated guests), City, Decor, Features, Parking, Style. Options inside each filter are alphabetical too.
- **Counts:** each checkbox and each City option shows a number in brackets: how many venues would be listed if you picked it, given the other filters already on. The numbers update as filters change. The two sliders, the Style boxes and Decor's "Included" / "For rent" boxes have no number.
- **Results:** update as filters change, show "Showing N of 45 venues", and are listed alphabetically.
- **Layout:** on screens 640px and wider, the filter column and results column each scroll on their own, so both are always reachable.

**Home page:** a "Popular searches" list of three plain links:
- **Budget:** price up to $2,000
- **Capacity:** 200+ seated guests
- **Outside catering allowed:** that checkbox turned on

## Key data decisions
Full detail is in [decisions.md](decisions.md). The October 2026 data cleanup changed several of these; [data/audit/APPLIED.md](data/audit/APPLIED.md) is the current word where they disagree. In short:
- **44 venues, all in Utah County.** Every row was checked against the venue's official website. Stone Gate (Virginia) and The Villa (Mississippi) were removed, and venues use the name their website uses.
- **Cities** come straight from the sheet's City column.
- **Filters are explicit sheet columns** (no keyword guessing). Event coordinators and sparklers count when the venue offers them, even as a paid add-on; other paid add-ons don't switch a filter on. Price and capacity are ranges, and a venue matches when its range overlaps the slider.
- **Photos** are **not** shown in the wireframe (it stays image-free on purpose). [data/photos.js](data/photos.js) holds 3–5 photos per venue for the prototype: each is linked from the venue's own website (not stored in the repo), labeled front / outdoor / indoor / extra, with the source page to credit.
- **Styles** are assigned from the *Description* column only, using just the 5 styles:
  - "Elegant" counts as **Classic**, unless the venue is very upscale (country club, castle, resort, hotel, full-service, destination estate), in which case it's **Luxury**.
  - **Outdoors** as a style means the setting centers on nature, such as farms, gardens, ranches or golf grounds. The *Outdoors* checkbox is separate and just means the venue has outdoor space.
  - Barteli Event Venue is Classic.
- **Price:** a venue matches if its price range overlaps the slider ($0–$10k+). Venues with no price drop out once the slider is moved.
- **Capacity:** uses the largest seated number (0–1000+). Venues with no seated capacity drop out once the slider is moved. Standing capacity is shown on the venue page.
- **Yes/no filters:** a blank cell counts as no, and only *included* services count. A paid add-on doesn't match.
- **Accessibility options:** Wheelchair accessible, Elevator, ADA restrooms, Accessible parking.
- **Parking:** just a "Designated lot" checkbox. The stall-count slider was dropped because only 6 venues list a stall count.
- **Decor:** items are derived from the spreadsheet in three groups, with "Included" and "For rent" checkboxes.

## Tree test mode (`?test`)
Follows the course Tree Test spec:
1. **Start:** the participant types their first name and is told that the site's structure is being tested, not them. The site gives them a random 6-digit participant number. The first name and number are saved on every result row automatically. The exported file is named after the number only.
2. **Tasks:** the tasks are shuffled separately for each participant.
3. **Each task:** the scenario is shown, the participant presses OK, the timer starts, and every click is recorded.
4. **End of a task:** a bar at the bottom of every page has two buttons, **I give up** and **I think I'm done**. The task ends only when the participant presses one of them. Opening a venue page does not end it.
   - **After each task:** the participant rates ease (1 very difficult to 7 very easy). If they pressed done, they also rate confidence (1 to 7).
5. **Scoring:** each task lists the facets a participant is expected to apply (`expected` in [data/tasks.js](data/tasks.js)). The score is the share of those parts satisfied by the filters applied when the task ends, from 0 to 1. For example, 2 of 3 expected facets scores 0.67.
6. **Each task records:**
   - participant number, participant first name, task, and order
   - target (the expected facets)
   - outcome: `success` (score 1), `partial`, `fail` (score 0), or `gave_up`
   - score, how many facets were right, which facets were right, and which were missed
   - every filter that was applied at the end, and the page or venue they finished on
   - first click, the predicted first click, and whether they match
   - full click path and click count
   - backtracks (returns to a page already visited)
   - elapsed time, scenario reading time, time to first click, and the time of every click
   - directness: `direct` (no backtracks and no filters turned off again) or `indirect`
   - wrong turns: filters turned on and later off, plus filters still on that the task did not call for
   - categorization used: Global nav, Explore filters, Popular searches, or a mix
   - pages visited in order, and which venue pages were opened
   - ease and confidence ratings
7. **`?results`:** shows a summary per task (mean score, success/partial/fail/give-up %, most-missed facet, median time, most common first click), a participant-by-task grid, a summary per participant (status, tasks completed, the order their tasks were shown, score and outcome counts, totals), and then each participant's own table with every task they completed. CSV/JSON download has one row per participant per task.
8. **Participant numbers are random, so they stay unique across computers.** Every task a participant completes is saved under the same number and first name, including after a page reload. CSV files from different laptops can be combined as they are.

**Important:** results are stored in the browser where the test ran. Run every participant on the **same laptop and browser**, and download the CSV after each session.

## Status and to-dos
- [x] **Scenarios are in.** The 10 tasks from [data/Tree Test Tasks - Sheet1.csv](data/Tree%20Test%20Tasks%20-%20Sheet1.csv) are in [data/tasks.js](data/tasks.js), each with `text`, `expectedFirstClick` and `expected` facets. The file's header comment lists the facet parts you can use.
- [ ] **Do a dry run** with a teammate before real participants. Include one give-up, then check the CSV export.
- [ ] **Write the Part 1 rationale paragraph.** Connect specific card-sort findings to the categories and labels above. The card-sort findings aren't documented in this repo yet; add them so the "Grounded in previous study" rubric item (16 pts) is covered.
- [ ] Run 8–10 participants, export the results, and analyze first clicks and paths.

## Updating venue data
**The Google Sheet is the source of truth.** Edit venue info there, not in the repo. The sheet is "Wedding Reception Project" on the team Drive ([open it](https://docs.google.com/spreadsheets/d/1QW8jezDjK2IZ13M2dSx2Gkv6WDSE3NCMrmlkE8jl2Jg/edit)); it must stay shared as "Anyone with the link can view" so GitHub can read it.

```
Google Sheet ──(Run workflow)──> data/venues.csv, data/venue-sections.csv, data/rates.csv ──(tools/build_data.py)──> data/venues.js + data/venues/<id>.json ──> site
```

**To change venue info**
1. Edit the sheet (tabs **Venues**, **Venue sections** and **Rates**; keep those tab names exactly).
2. On GitHub: **Actions → Venue data → Run workflow** (branch `main`). In about a minute it downloads both tabs, rebuilds the site data, and commits the result as "venue-data bot". If nothing changed, it commits nothing.
3. **`git pull`** before your next local edit, because the workflow committed to `main`.
4. The live site updates 1–2 minutes later. Browsers may cache `venues.js` for about 10 minutes; for a demo, raise the `?v=` number on the `venues.js` line in [site/index.html](site/index.html) and [index.html](index.html), then push.

**Sheet format (the build checks these and stops with a clear error if they're broken)**
- **Venues tab:** one row per venue.
  - `Venue ID` is permanent. It is the page address (`#/venue/<id>`) and the key for photos and style tags, so don't change it, even when renaming a venue.
  - `Price Low` / `Price High` and `Seated Low` / `Seated High` / `Standing Low` / `Standing High` are plain numbers that feed the sliders; leave both blank if the venue doesn't publish one. `Price Basis` is `rental`, `per-person x capacity` or `full-service package`.
  - **Filter columns** are named `<Group>: <Option>` (e.g. `Features: Bridal room`, `Decor: Chandeliers`). A blank cell means no. Otherwise the cell starts with `Included:`, `Add-on:`, `For rent:` or `Included + for rent:`, followed by a short neutral label (e.g. `Included: Bridal suite with balcony`). That label shows under the feature on the venue page, so write it as a plain description, not in the venue's voice ("we", "our", "you", "beautiful").
  - **Rule columns** `Rule: Alcohol`, `Rule: Pets`, `Rule: Confetti`, `Rule: Music cutoff`: `Allowed`, `Not allowed` or `Conditions: <what they are>`, optionally followed by a short note (`Not allowed: No dogs`). Leave blank if the venue doesn't say. They show as the quick rules at the top of the Rules section; the full wording stays in `Restrictions` and `Alcohol policy`.
  - **`Days Open`**: days the venue books events, as days and ranges (`Tue–Sat`, `Mon, Wed–Sat`). It draws the week strip; anything it can't read shows as plain text. **`Hours`**: a short summary for the at-a-glance strip (`3–9pm or 4–10pm`).
  - The other columns (Packages and Prices, Catering, Restrictions…) appear in the venue page's *Detailed information*; one item per line. Base rental prices belong in the Rates tab; Packages and Prices holds add-ons, fees and what's included.
- **Rates tab:** one row per base price. Columns: `Venue ID`, `Space / package`, `Season`, `Days`, `Hours`, `Price`, `Note` (`Price` is required; write `On request` if there is none). Leave a column blank when it doesn't apply. The page turns each package into a table: days down the side and season or time block across; packages priced over the same days share one table, and one-row packages are listed together. Write the same `Season`, `Days` and `Hours` wording on every row of a package so the rows line up.
- **Venue sections tab:** extra sections a venue needs (spaces, ceremony sites, rain plan, lodging…). Columns: `Venue ID`, `Section` (title), `Place After` (one of `overview, pricing, capacity, rooms, included, av, decor, other, food, rules, access, notes, contact`), `Label`, `Value`. One row per item.

**Adding a new venue:** add a row with a new lowercase `Venue ID` (e.g. `new-venue-name`), then in the repo add its style tags to `STYLES` in [tools/build_data.py](tools/build_data.py) (the build warns if it's missing) and, optionally, its photos to [data/photos.js](data/photos.js) under the same ID.

**Working locally instead of the workflow**
```bash
python3 tools/sync_sheet.py --check   # compare the sheet with data/*.csv, change nothing
python3 tools/sync_sheet.py           # download the tabs and rebuild
python3 tools/build_data.py           # rebuild only (after editing data/*.csv by hand)
```
Pushing an edited `data/*.csv` also makes the workflow rebuild automatically, but a hand-edited CSV is overwritten the next time someone syncs from the sheet, so put the change in the sheet too.

**If the workflow fails:** open the failed run on the Actions tab; the last lines name the problem (for example, a filter cell that doesn't start with `Included:` / `Add-on:` / `For rent:`, an unknown `Place After`, a rule cell that isn't `Allowed` / `Not allowed` / `Conditions:`, a renamed tab, or a sheet that's no longer link-shared). If it says the sheet is missing the `Rates` tab or a `Rule:` / `Days Open` / `Hours` column, the sheet is older than the repo: import that tab or those columns from `data/` first (the check stops so an old sheet can't overwrite newer data). Fix the sheet and run it again. The workflow file is [.github/workflows/venue-data.yml](.github/workflows/venue-data.yml).

## Editing and publishing
Saving a file only changes your computer. The live site updates after you **commit and push**, and GitHub Pages takes about 1–2 minutes to rebuild.

1. Venue info: see [Updating venue data](#updating-venue-data) above.
2. If you changed `style.css`, `app.js` or anything in `data/`, raise the `?v=` number on the four file lines in `index.html`. Otherwise browsers may keep showing the old version for about 10 minutes.
3. Commit and push:
   ```bash
   git add -A && git commit -m "Describe your change" && git push
   ```
Run `git pull` before editing so you start from the latest version.

To preview locally, run this and open http://localhost:8356:
```bash
python3 -m http.server 8356
```

## Files
```
index.html          page shell (header nav, main, footer)
style.css           wireframe styles (black/white, one font)
app.js              pages, Explore filters, venue pages, click log, test mode, results
site/               hi-fi site (index.html, site.css, site.js)
data/venues.csv     Google Sheet tab "Venues" (downloaded by tools/sync_sheet.py)
data/venue-sections.csv  Google Sheet tab "Venue sections"
data/rates.csv      Google Sheet tab "Rates"
data/venues.js      generated by tools/build_data.py, do not edit by hand
data/venues/        generated: one JSON per venue (filters + ordered page sections)
data/photos.js      venue photos for the prototype (not used by the wireframe): linked from each venue's site, labeled, with credit source
data/tasks.js       tree-test scenarios (10 tasks)
data/audit/         2026-10 data audit: sources and reasons for every change
tools/sync_sheet.py Google Sheet → data/*.csv (read-only), then build
tools/build_data.py data/*.csv → venues.js and data/venues/ (style tags, checks)
.github/workflows/venue-data.yml  "Run workflow" button: sync + build + commit
```
No build tools or external libraries are used. It's plain HTML, CSS and JavaScript hosted on GitHub Pages from the `main` branch.

## Change history (from team discussion)
- Hosting set up on GitHub Pages.
- Information architecture defined; venue data loaded from the spreadsheet; styles tagged from descriptions.
- Location and Style menus changed to open Explore with the filter pre-set, instead of separate list pages.
- Hover color removed; buttons and boxes stay white.
- Explore layout fixed so the filters and results stay visible and each scrolls on its own.
- Venue website link added to the venue summary.
- Dropdown menus and the carousel replaced with plain, always-visible lists.
- Filters (Price first) and venues put in alphabetical order.
- Popular searches shortened to "Budget", "Capacity", "Outside catering allowed".
