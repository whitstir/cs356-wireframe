# Venue data audit: review this first (2026-10-26)

All 46 spreadsheet rows were checked against each venue's **official website only**. **Nothing is applied yet:** `data/venues.csv`, `tools/build_data.py` and the site are unchanged, and nothing is committed.

## What's in this folder

| File | What it is |
|---|---|
| `venue-audit.csv` | **The audit.** 3,036 rows: one for every column and every filter option of every venue. Columns: current value, verified value, action, **change_origin** (where the change came from), source URL, evidence quote, confidence, fix_type, notes |
| `filter-changes.csv` | Only the filter rows that changed (322). Start here, since filters matter most |
| `venues-proposed.csv` | The corrected spreadsheet, the same 32 columns as `venues.csv`. It becomes the new sheet after your review |
| `auditor-notes.md` | Every question the auditors couldn't settle, by venue |
| `STYLE-SUGGESTIONS.md` | Suggested style tag changes and rule changes (not applied) |
| `STAGE3-DESIGN.md` | How each venue page will be organized, where each filter lives, and the sheet → JSON regeneration rule |
| `FIELD-GUIDE.md`, `AUDIT-BRIEF.md` | What each column and filter means, and the rules every auditor followed |
| `venues/*.json` | The raw per-venue audit (pages checked, structured venue sections, style reasoning) |

## Headline findings

- **The data was much less accurate than it looked.**
  - 580 values corrected, 402 added, 82 removed, 960 confirmed.
  - The other 1,012 cells were blank and the site is silent on them too.
- **Filters:** 43 of 45 venues had at least one wrong filter, 322 filter values in all. By group:

  | Group | Values changed |
  |---|---|
  | Decor | 103 |
  | Features | 78 |
  | Other | 52 |
  | A/V | 34 |
  | Accessibility | 23 |
  | Price | 12 |
  | Capacity | 12 |
  | City | 8 |

- **Wrong cities (8):**
  - Castle Park, Walker Farms and Wild Oak are in **Lindon**.
  - The Bungalow is in **Pleasant Grove**.
  - River Bridge and Maplewood are in **Spanish Fork**.
  - Emerald Eve is in **Salem**, a new city for the list.
  - TalonsCove is in **Saratoga Springs**.
- **Contact info was wrong on 30 venues**, and 21 street addresses were wrong. Most of the old phones and emails appear nowhere on the venues' sites; the AI collector seems to have made them up.
- **Links:**
  - 2 are broken: Riverside (404) and Provo Library (certificate error).
  - 3 point to the wrong place: The Oaks now redirects to a city golf page; Sun River and TalonsCove have separate wedding sites.
  - `venues-proposed.csv` uses the fixed links.
- **Out-of-area rows:**
  - **Stone Gate** links to a different business in Virginia. A Utah venue with the same name exists: **Stone Gate Weddings & Events**, Pleasant Grove (stonegateweddings.com).
  - **The Villa at the Retreat** really is in Mississippi.
  - **Walker Farms** is actually in Lindon, so it's fine.
  - **Sun River Gardens** still runs a reception venue (sunriverreceptions.com).
- **Quality:**
  - Every change has a source page and a reason.
  - 2,494 rows are high confidence, 431 medium (read from images, PDFs or gallery captions) and 20 low (inferred; listed in the notes).
  - Nothing came from Instagram, The Knot or other third-party sites.
  - I spot-checked findings from different auditors against the live sites, and all matched.

## Decisions needed (they affect many venues)

1. **Filters: keep the keyword guessing, or store each filter's value explicitly?**
   - Today `build_data.py` guesses filters from free text. That caused many errors, e.g. "bar" matched "bar-height tables", "welcome" matched "food trucks welcome", "vases" counted as florals, and the coordinator rule fired on any line without a `$`.
   - **Recommendation:** add one column per filter group to the sheet (e.g. `Features` = "Bridal room; Cleanup crew"), filled from the audit, and drop the guessing. Each filter is then exactly what the audit verified, and the team can edit it.
2. **What counts as "Event coordinator"?** An onsite attendant, host, building manager or booking-only staff? The auditors said **no**, unless the site names an included coordinator. This affects about 10 venues.
3. **What counts as "Cleanup crew"?** Only real cleaning, or also "set-up and take-down"? The auditors used real cleaning only.
4. **Sparklers sold as a paid package** (River Bridge, Maplewood, TalonsCove, Copper Creek): leave "Sparklers allowed" off (included-only rule), or treat it as allowed?
   - The auditors weren't consistent here. Copper Creek was left **on** while the other three are **off**.
   - "Allowed" arguably isn't the same question as "included", so I lean toward **on** whenever the venue permits sparklers, paid or not.
5. **Capacity when the site only gives a chair count** (Orion 200, Big Willow 100, White Willow 100, Willow Springs 150, Bungalow 165 chairs vs 70 dinner): use the chair count (now marked low confidence) or leave it blank?
6. **Price slider for per-person and full-service prices** (Convention Center, Marriott, Chillon) and very wide ranges (Castle Park up to $8,675, Quiet Meadows all-day $8,800, Springville Museum $805+): which number feeds the slider?
7. **"Dressing rooms"**: do they count as Bridal room and Groom's room? (Bungalow, Shade, Maplewood, TalonsCove)
8. **Rows:**
   - Replace Stone Gate with the Pleasant Grove venue (needs a new audit), or keep it excluded?
   - Exclude The Villa?
   - Keep Walker Farms and Sun River (both look fine now)?
9. **New cities:** add Salem and Saratoga Springs to the Location list. Riverton and Carriere drop out once those rows move or are excluded.
10. **Names:** several sites use a different name from the sheet:
    - Quiet Meadow Farm
    - Shade Weddings and Events
    - Barteli Reception Hall
    - Sleepy Ridge Weddings
    - The Villa

    Rename them, or keep the sheet's names?
11. **Calls before the demo** (the sites can't answer these):
    - Is Sun River's expansion finished, and is it taking bookings?
    - Is Sleepy Ridge renovating?
    - Rooftop's real seated capacity (its pages say 280, 300 and 200).

## Notes

- Venue sites change. Every row records the page it came from, and the plan adds a "last checked" date to each venue.
- One auditor's attempt to open a PDF triggered a download dialog in the built-in browser; nothing was downloaded to the project. Dismiss the dialog if it's still showing.
