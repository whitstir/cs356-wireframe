# Utah County Wedding Venues — Wireframe (CS 356)

A black-and-white wireframe of a site that presents **wedding reception venues in Utah County**. It's built for the CS 356 Part 1 wireframe assignment, and it doubles as the **tree-test instrument** for Part 2 usability testing.

This README summarizes what the team has discussed and decided so far, so anyone opening the repo can catch up.

## Links

| What | URL |
|---|---|
| Live site | https://whitstir.github.io/cs356-wireframe/ |
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

**Information blocks (leaves):** 46 venues from the team's venue spreadsheet. Every venue has its own endpoint page that reads "You reached: [Venue]". The page shows a summary with name, city, website link, description, price, seated and standing capacity, styles, features, A/V, accessibility and decor. Below it, an expandable "All venue details" section holds every spreadsheet field, grouped, with empty fields hidden.

**Categorization 1 — global navigation (top of every page, plain links, no dropdowns):**
- **Location:** 15 cities, alphabetical. Each opens Explore filtered to that city.
- **Style:** Classic, Luxury, Modern, Outdoors, Rustic. Each opens Explore filtered to that style. A venue can have several styles.
- **Explore all venues:** opens the filter page with nothing selected.

**Categorization 2 — Explore page (faceted filters):**
- **Filter order:** Price is first, and the rest are alphabetical: Accessibility options, Audio/Visual, Capacity (seated guests), City, Decor, Features, Parking, Style. Options inside each filter are alphabetical too.
- **Results:** update as filters change, show "Showing N of 46 venues", and are listed alphabetically.
- **Layout:** on screens 640px and wider, the filter column and results column each scroll on their own, so both are always reachable.

**Home page:** a "Popular searches" list of three plain links:
- **Budget:** price up to $2,000
- **Capacity:** 200+ seated guests
- **Outside catering allowed:** that checkbox turned on

## Key data decisions
Full detail is in [decisions.md](decisions.md). In short:
- **All 46 spreadsheet rows are kept.** That includes a few that aren't actually in Utah County (Stone Gate in Concord, The Villa at the Retreat in Carriere, Walker Farms in Riverton) and Sun River Gardens, which is a garden center.
- **Missing cities:**
  - Southworth Hall, Utah Valley Convention Center and Provo Library Ballroom → Provo
  - Chillon Reception Center → Springville
  - Orion Event Venue → Lindon
  - Hobble Creek → Springville
  - TalonsCove → Saratoga Springs
  - River Bridge → Spanish Fork (the spreadsheet said Springville)
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
1. **Start:** the participant enters an ID and is told that the site's structure is being tested, not them.
2. **Tasks:** the tasks are shuffled separately for each participant.
3. **Each task:** the scenario is shown, the participant presses OK, the timer starts, and every click is recorded.
4. **End of a task:** the task ends when they reach any venue page or press **I would give up**.
5. **Each task records:**
   - participant, task, and order
   - target venue
   - outcome: `success`, `fail` (wrong venue), or `gave_up`
   - the venue reached
   - first click and the predicted first click
   - full click path and click count
   - backtracks (returns to a page already visited)
   - elapsed time
6. **`?results`:** shows a summary per task (success %, give-up %, median time, most common first click) plus every result row, with CSV/JSON download.

**Important:** results are stored in the browser where the test ran. Run every participant on the **same laptop and browser**, and download the CSV after each session.

## Status and to-dos
- [ ] **Scenarios are blank on purpose.** The team will write the exact wording. Fill in the 10 slots in [data/tasks.js](data/tasks.js), each with `text`, `target` (venue name or id) and `expectedFirstClick`. Until then, `?test` shows a "no scenarios set up" screen. Drafts that each have exactly one correct venue are in [wireframe-spec.md §7](wireframe-spec.md); use them as a starting point.
- [ ] **Do a dry run** with a teammate before real participants. Include one give-up, then check the CSV export.
- [ ] **Write the Part 1 rationale paragraph.** Connect specific card-sort findings to the categories and labels above. The card-sort findings aren't documented in this repo yet; add them so the "Grounded in previous study" rubric item (16 pts) is covered.
- [ ] Run 8–10 participants, export the results, and analyze first clicks and paths.

## Editing and publishing
Saving a file only changes your computer. The live site updates after you **commit and push**, and GitHub Pages takes about 1–2 minutes to rebuild.

1. If you edited the venue spreadsheet ([data/venues.csv](data/venues.csv)), regenerate the site data:
   ```bash
   python3 tools/build_data.py
   ```
   City fixes and style tags live in that script (`CITY` and `STYLES`).
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
data/venues.csv     source venue spreadsheet
data/venues.js      generated by tools/build_data.py, do not edit by hand
data/tasks.js       tree-test scenarios (currently blank)
tools/build_data.py spreadsheet → venues.js (city fixes, style tags, decor items)
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
