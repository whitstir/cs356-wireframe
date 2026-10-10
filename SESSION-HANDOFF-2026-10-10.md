# Session handoff: tree test build, data and analysis

Written on 2026-10-10 so another Claude session can pick up the CS 356 tree-test work without the original conversation. It covers what was built, where the data is, what the analysis found, and what is still owed for the report.

## Where things stand

- **Site and test instrument:** finished and pushed. `main` matched `origin/main` when this file was written. Live site: https://whitstir.github.io/cs356-wireframe/ (`?test` runs a tree test, `?results` shows and exports results).
- **Data collection:** done. 8 participants, 10 tasks each, 80 task runs.
- **Analysis:** results table, per-task evidence tables, per-task conclusions and 20 charts are done (all below or referenced below).
- **Report:** not written. See "Still to do for the report".

The repo owner is `whitstir`; Darbi is a collaborator and works with a partner (Whit). The README documents committing straight to `main`, which GitHub Pages publishes.

## The assignment

- Course page: https://mikejonesbyu.github.io/principlesOfTeaching-site/companion/studies/02-tree-test.html
- It is a moderated, think-aloud tree test run on the team's own wireframe, graded on a 60-point report.
- The report needs: the ten tasks (text, target, predicted first click, rationale), participants, a results table (one row per task), listening notes, analysis, design decisions written as "Because [result], we will [decision]", the full hierarchy with changes marked (NEW, RENAMED from X, MOVED from Y, REMOVED), what is being ignored, and a link to the raw data.
- The course page asks for at least 10 participants; the assignment text Darbi pasted says 8 to 10. The study has 8.
- The course page stresses reporting first-click ties as ties, saying where a participant was when they gave up, not stopping at the pass rate, and linking the raw log unedited.

## Files

| File | What it is |
|---|---|
| `data/Tree Test Tasks - Sheet1.csv` | The team's task sheet: task text, predicted first click, target, `also_reachable_via`, rationale |
| `data/tasks.js` | The same 10 tasks as the site uses them, with `expected` facets for scoring |
| `data/tree-test-complete-results.csv` | All 80 task runs merged into one table (37 columns). Working copy for analysis |
| `data/tree-test-results-*.csv` | The five original exports the merged file was built from. These are the raw data |
| `data/tree-test-charts/` | 20 PNG charts (two per task) plus `index.html`, a gallery of them. Not committed when this was written |
| `README.md` | Project summary, including the tree-test flow and every recorded column |
| Google Doc "Tree Test Results Tables" | https://docs.google.com/document/d/19qXQVcosiO5hpTmzAt1gdOEwt-q1vKvV89QIUvgL_84/edit (in Darbi's Drive). Holds the results table and ten per-task evidence tables |

Participants in the merged file, by participant number: 444820 Katherine, 775204 Sonora, 970070 Erick, 364123 Rachel, 383841 Allie, 947544 Ellee, 898565 tate, 421137 Mason.

Privacy decisions made in the session:

- The test asks for a first name only, and exports are named by participant number only.
- Participant 364123's row set holds a full name in `participant_name`; the others are first names. A surname was removed by hand from the file for 444820.
- Because of those two edits and the merge, link the original per-session files as raw data and describe the merged file as a working copy.

## What the test instrument does

Built in `app.js` during the session (see README for the full list):

- Tasks are shuffled separately for each participant. Each participant gets a random 6-digit number, saved with their first name on every row.
- A task ends only when the participant presses "I think I'm done" or "I give up". They then rate ease (1 very difficult to 7 very easy) and, unless they gave up, confidence (1 to 7).
- **Scoring:** `score` is the share of the task's expected facets that were on when the task ended. `outcome` is `success` (score 1), `partial`, `fail` (score 0) or `gave_up`. A give-up keeps its score but is never counted as a success.
- The score uses the filters from the participant's last visit to the Explore page. Opening a venue afterwards does not change it.
- The Explore page shows a live count next to every checkbox and City option (not on Style, the sliders, or Decor's Included / For rent). The counts were visible during the test.

Columns in the results CSV that the analysis leans on:

| Column | Meaning |
|---|---|
| `first_click`, `first_click_expected`, `first_click_match` | First click, the predicted one, and whether they match |
| `target`, `facets_correct`, `facets_missed` | Expected facets and which were satisfied or missed |
| `filters_applied` | Every filter on at the end ("at end" in the tables and charts) |
| `click_path`, `click_times_s` | Every click in order ("at any point" values are read from `click_path`) |
| `filters_undone`, `extra_filters`, `wrong_turns` | Filters turned on then off; filters left on that the task did not call for |
| `directness` | `direct` = no backtracks and no undone filters |
| `categorization_used` | Global nav, Explore filters, Popular searches, or a mix |
| `finish_page`, `finish_block`, `pages_visited`, `venues_opened` | Where they ended and what they looked at |
| `reading_ms`, `time_to_first_click_ms`, `elapsed_ms` | Timing |
| `ease_rating_1to7`, `confidence_rating_1to7` | Post-task ratings |

Behaviors that affect how the data should be read:

- **Navigation links replace filters.** Clicking a Location link, a Style link or "Explore all venues" wipes the filters already set. This cost at least three runs their target (tasks 1 and 6).
- **The home page "Capacity" link sets 200 or more guests,** the opposite of task 7's target.
- **The home page "Budget" link sets $0 to $2,000,** which counts as "price range adjusted" for task 4 even if the participant never touched the slider.
- The analysis scripts were run from a temporary folder and were not saved to the repo. Everything can be recomputed from `tree-test-complete-results.csv` using the definitions above.

## Results table

"Success" means every target filter was on when the participant pressed "I think I'm done". Times are means. Task 8 and task 10 times were first reported as 54 s and 40 s; 53 s and 39 s are the corrected values.

| Task | Predicted first click | Most common first click | Target | Where they ended up | Success | Give-ups | Avg time |
|---|---|---|---|---|---|---|---|
| 1 Staircase, columns, ballroom | Style global nav | Explore, 4 of 8 | Style: Classic | Style: Luxury on, 3 of 8 (Classic 2) | 1 of 8 (13%) | 2 | 161 s |
| 2 Parking for large family | Explore | Explore, 4 of 8 | Parking: Designated lot | Designated lot on, 7 of 8 | 7 of 8 (88%) | 0 | 30 s |
| 3 Minimalistic, exit, cake | Explore | Explore, 5 of 8 | Style: Modern + Sparklers allowed + Cake table | Cake table 5, Sparklers 4, Modern 2; all three, 0 of 8 | 0 of 8 (6 partial) | 0 | 111 s |
| 4 Perfect price | Explore | Popular search: Budget, 6 of 8 | Price range adjusted | Price filter on, 7 of 8 | 7 of 8 (88%) | 0 | 67 s |
| 5 Whimsical, outside, flowers | Explore | Explore, 4 of 8 | Outdoors (style or feature) + Greenery / florals | Both on, 6 of 8 | 6 of 8 (75%), 1 partial | 0 | 50 s |
| 6 Activities for guests | Explore | Explore, 6 of 8 | Two or more Specialty stations | Microphone + Sound system, 3 of 8; target, 1 of 8 | 1 of 8 (13%) | 2 | 96 s |
| 7 Small group | Explore | Popular search: Capacity, 7 of 8 | Capacity up to 200 | Capacity max of 75–150, 5 of 8 | 5 of 8 (63%) | 1 | 48 s |
| 8 Provo, grandma's mobility | Provo | Explore, 4 of 8 | City: Provo + Wheelchair accessible | Wheelchair accessible 8 of 8; with Provo, 3 of 8 | 3 of 8 (38%), 5 partial | 0 | 53 s |
| 9 Photographer | Luxury | Explore, 4 of 8 | Style: Luxury + an Aesthetics item + Photo booth | Luxury 2, Aesthetics 2, Photo booth 1; all three, 0 of 8 | 0 of 8 (5 partial) | 1 | 117 s |
| 10 Uncle's catering | Outside catering allowed | Popular search: Outside catering allowed, 5 of 8 | Features: Outside catering allowed | Outside catering on, 8 of 8 | 8 of 8 (100%) | 0 | 39 s |

No task had a tie for most common first click. Task 9's mean time is pulled up by one 550-second run; its median is 55 s. Across all 80 runs: 38 success, 17 partial, 19 fail, 6 gave up; the first click matched the site's recorded prediction in 29.

The same table, plus a per-participant evidence table for each task, is in the Google Doc linked above.

## Conclusions for tasks 1–10

Reproduced exactly as given in the session. Four targets are supported, three are partly supported, and three are not supported. The predicted first click matched the most common first click on 5 of 10 tasks.

**Task 1, Style: Classic — not supported**
- Classic was on at the end for 2 of 8, and Luxury for 3 of 8.
- Five people applied Classic at some point, but three of them dropped it; all three who applied Luxury kept it.
- Finish venues were mostly Luxury-tagged: Castle Park twice, plus Chillon and Wadley Farms, which are tagged both.
- Alternate evidence: people hunted for the literal features, with Indoors on for 3 and Chandeliers for 2.
- `also_reachable_via` (Explore → Classic): relevant. Three used the Classic checkbox in Explore, against two who used the Style link.
- This was the slowest task, with the most backtracking.

**Task 2, Designated lot — supported**
- 7 of 8 applied it. The one miss chose "Accessible parking" instead.
- Alternate evidence: half read "large family" as a capacity need. Three first-clicked the Capacity link, and four finished with a capacity filter of 200+ or 500+.

**Task 3, Modern + Sparklers + Cake table — partly supported**
- Cake table (5 of 8) and Sparklers allowed (4 of 8) were found; 7 of 8 opened Decor.
- Modern is the weak part: 2 of 8 ended on Modern and 3 of 8 on Classic, so "minimalistic" did not point to Modern.
- `also_reachable_via` (Style: Modern link): weakly relevant. Two clicked it, one as a first click.

**Task 4, user adjusts price — partly supported**
- 7 of 8 ended with a price filter, but four never touched the slider; they kept the Budget link's $0–$2,000.
- The three who set their own maximum chose $3,000, $7,500 and $7,750, so there is no agreed "perfect price".
- `also_reachable_via` (Home → Budget): strongly relevant. It was the first click for 6 of 8, against 1 for the predicted Explore.

**Task 5, Outdoors + Greenery — supported**
- 6 of 8 had both; 4 finished on the same venue, Shade Home and Garden.
- Your style-versus-feature question: Style: Outdoors was on for 5, Features: Outdoors for 3, and one person had both.
- `also_reachable_via` (Features: Outdoors): relevant. Two succeeded using the feature alone.

**Task 6, Specialty stations — not supported**
- Six opened Decor, but only three ticked any Specialty station and one finished with two.
- People looked elsewhere for "activities": Microphone and Sound system (3 at the end), and Event coordinator (tried by 3).
- One person had three stations on, then clicked "Explore all venues", which cleared them, and was scored a fail.

**Task 7, Capacity under 200 — supported, with a wrong first click**
- All 8 used the capacity slider. The five successes set a maximum of 75, 75, 100, 100 and 150.
- Seven first-clicked the home page Capacity link, which sets 200 or more, the opposite of the task. Five then dragged it back.
- The three misses: a maximum of 350, a minimum of 50 with no maximum, and a give-up with the link's 200+ untouched.

**Task 8, Provo + Wheelchair accessible — partly supported**
- All 8 applied Wheelchair accessible, so that label was found.
- Only 3 had City: Provo at the end. Four finished on Conrad Ranch, the only wheelchair-accessible Provo venue, one of them without the city filter.
- Label breadth: ADA restrooms (5), Accessible parking (4) and Elevator (4) were also turned on, and mostly turned off again.
- `also_reachable_via` (Explore, same facets): relevant. Explore was the first click for 4, the Provo link for 2. Of the three with Provo at the end, two used the link and one the City dropdown.

**Task 9, Luxury + Aesthetics + Photo booth — not supported**
- Nobody first-clicked Luxury; first clicks split five ways.
- At the end, Luxury was on for 2, an Aesthetics item for 2, and Photo booth for 1. Classic was also on for 2.
- Only half opened Decor.
- Mean confidence was 5.1 of 7 with zero full successes, so people believed they had finished.
- `also_reachable_via` (Explore, same facets): Explore was the top first click (4 of 8), but it did not lead to the target facets.

**Task 10, Outside catering allowed — supported**
- 8 of 8 succeeded.
- `also_reachable_via` (Explore, same facet): relevant. Six used the home page link and two used the Explore checkbox, so both routes work and the home page is preferred.

### Cautions when reporting

- **Task 1's prediction:** the sheet says "Style global nav", but the site recorded the prediction as "Style: Classic". By the sheet's wording 3 of 8 matched (Luxury 2, Classic 1); by the site's, 1 of 8.
- **Navigation links replace filters:** clicking a Location, Style or "Explore all venues" link wipes the filters already set. This cost at least three runs their target (tasks 1 and 6) and is a finding in itself.
- **One give-up had the right answer:** on task 1, one person had Classic on, opened two venues, and still gave up. It is counted as a give-up, not a success.
- **One fast participant:** one person finished several tasks in under 20 seconds and accounts for 6 of the 19 fails.
- **Sample size:** with 8 people, one participant moves a rate by 13 points.

## Charts

`data/tree-test-charts/` holds 20 PNG images, two options per task, named like `task07-option-a-capacity-maximum.png`. `index.html` in the same folder shows them side by side. Every chart is drawn from `tree-test-complete-results.csv`, uses the task text as its subtitle, and marks the target or predicted item in blue.

| Task | Option A | Option B |
|---|---|---|
| 1 | Style filter on at the end: Classic 2, Luxury 3, none 3 | Classic vs Luxury: applied at any point vs still on at the end |
| 2 | Filters on at the end: Designated lot 7, capacity slider 4 | First click, with the predicted one marked |
| 3 | Each target filter on at the end, and all three together (0) | Style chosen for "minimalistic": Modern 2, Classic 3 |
| 4 | First click: Budget link 6, predicted Explore 1 | Price limit at the end, split by Budget link default vs own slider setting |
| 5 | Which Outdoors filter was used: style, feature, both, neither | Each target filter on at the end, and both together |
| 6 | Steps toward the target: opened Decor 6, ticked a station 3, finished with two 1 | What people finished with instead: Microphone, Sound system and others |
| 7 | Capacity maximum per participant against the 200 target line | First click: Capacity link 7, predicted Explore 1 |
| 8 | Wheelchair accessible 8, City: Provo 3, both 3 | Accessibility options: turned on at any point vs still on at the end |
| 9 | Each target filter on at the end, and all three together (0) | First click, showing predicted Luxury at 0 |
| 10 | Route to the filter: home page link 6, Explore checkbox 2 | First click, with the predicted one marked |

Notes on the charts:

- Five of the 20 were inspected closely after rendering (1B, 4B, 7A, 8B, 9B); the other fifteen were not checked one by one.
- Task 7 Option A labels its bars with participants' first names.
- They were rendered from generated SVG with headless Microsoft Edge (matplotlib is not installed on Darbi's machine). The generating script was not saved to the repo.

## Still to do for the report

- **Listening notes:** half a page from the think-aloud sessions. Nothing from the interviews is in this repo; Darbi and Whit hold those notes.
- **Design decisions:** one "Because [result], we will [decision]" per change or deliberate keep. Likely candidates from the data:
  - nav links replacing filters
  - the Capacity and Budget home page links
  - the Luxury / Classic split
  - "Specialty stations" as the home for activities
  - Style: Outdoors vs Features: Outdoors
- **Hierarchy with changes marked:** the as-tested hierarchy is described in the README ("How the site is organized"); it needs writing out as an indented outline with NEW / RENAMED / MOVED / REMOVED marks tied to the decisions.
- **What is being ignored,** with reasons.
- **Participants section:** names, how they were recruited, how they relate to the users.
- **Task rationale:** the `rationale` column of the task sheet has a line per task.
- **Raw data link:** point to the per-session CSVs in `data/`.

## Working preferences that came up

- Darbi prefers to be told what changed after each edit, and asked for changes to be verified by running the site.
- Do not commit files containing participants' full names; a commit of one was blocked for that reason.
- The local site runs with `python -m http.server 8356` from the repo folder (`python3` on this Windows machine points to the Store stub). Stop it when finished.
- After changing `app.js`, `style.css` or anything in `data/` that the site loads, raise the `?v=` number in `index.html` (it was 20).
