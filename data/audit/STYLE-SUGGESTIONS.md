# Style suggestions (not applied)

These are suggestions only. `STYLES` in `tools/build_data.py` has not been changed. Each auditor compared the current tags with how the venue's official site describes and shows itself. The full reasoning is in each venue's `style_suggestion` in `data/audit/venues/`.

**31 of 45 venues keep their tags.** Here are the 14 suggested changes (2 of them optional):

| Venue | Now | Suggested | Why |
|---|---|---|---|
| The Startup Building | Modern, Classic | + **Rustic** | The site calls itself rustic-industrial |
| Riverside Country Club | Luxury | + **Outdoors** | Golf course with mountain views; matches how Sleepy Ridge is tagged |
| The Blake | Modern, Classic | − **Classic** | Classic came only from the AI's "modern elegance"; the site says sleek and modern |
| The Rehearsal Hall | Modern, Luxury | − **Modern**, + **Outdoors** | "Light-filled" was invented; the site sells its woods, streams and mountain setting |
| Grove Station | Modern | + **Classic** (optional) | The site says "elegance and class with a fun and modern feel" |
| The Bungalow Event Venue | Classic, Luxury | − **Luxury**, + **Outdoors** | A family-run, mid-priced venue; gardens, gazebo and grape arbors lead the site |
| The Villa at the Retreat | Luxury, Outdoors | Classic, Rustic, Outdoors | "Rustic charm and French-inspired elegance" (moot if the row is excluded) |
| Wild Oak Venue | Modern | + **Classic**, + **Rustic** | "Modern design meets rustic charm", "timeless elegance", historic warehouse |
| Walker Farms | Classic, Modern, Rustic, Outdoors | − **Classic** | "Historic" only describes what inspired a newly built barn |
| Castle Park | Luxury | + **Outdoors** | "Acres of beautiful gardens"; the gallery is mostly garden shots |
| The Lodge at Traverse Mountain | Rustic | + **Outdoors** (optional) | Patio with three fireplaces and valley views, but the venue is mostly indoors |
| Northridge Valley Event Center | Modern, Classic | + **Rustic** | A converted 1981 barn with stonework and farmhouse tables |
| The Oaks at Spanish Fork | Modern | **Outdoors** only | "Modern" was invented; it's a golf-course event center with a deck |
| Chillon Reception Center | Luxury, Classic | − **Luxury** | Only castle-inspired; buffet and punch menus; the site stresses history (Classic) |

Net change by style if all are accepted:

| Style | Net change |
|---|---|
| Outdoors | +6 |
| Rustic | +4 |
| Classic | +3 / −2 |
| Luxury | −3 |
| Modern | −2 |

## Suggested rule changes (decisions.md, "Style tagging rules")

The audit found that **most wrong tags came from wording the AI collector invented in the Description**, not from the rules themselves. So the biggest fix is the source, not the rules.

1. **Tag from the venue's own words.** Today styles come from the Description, which the AI wrote. Instead, tag from the venue's own style words, now verified and kept in the `Style` column, together with the corrected Description. Never tag from words that aren't on the official site.
2. **Luxury: narrow it to genuinely upscale venues.** Keep resort, hotel, private country/golf club and destination estate.
   - Drop "castle" when the building is only castle-*inspired* (Chillon).
   - Drop "full-service" when it just means a catering package (Chillon, Barteli).
   - Drop "European estate" for mid-priced venues (Bungalow).
   - **Rooftop** is still a judgment call (Rooftop Venue keeps Luxury under the current rule).
   - Add a price cue: rentals that start under about $3,000 aren't Luxury unless they're a resort or club.
3. **Outdoors: count gardens and golf grounds when the venue sells them as a main setting.** Count them when the site's own text or gallery leads with them (Castle Park, Bungalow, Riverside, The Oaks, Rehearsal Hall). Don't count a patio or lawn that is secondary to an indoor hall (Northampton, Willow Springs, Lodge).
4. **Classic: "historic" alone shouldn't make an industrial conversion Classic.** Require a traditional look (elegant, timeless, classic) as well (Bright Building, Walker Farms). Keep "historic" on its own for churches, mansions and museums.
5. **Rustic: add the cues "reclaimed wood" and "converted barn"** (Redford, Northridge).
6. **Hand tags:** for Barteli and River Bridge, the corrected Description contains no style words, so their Classic tag stays a judgment call. Mark hand tags in `STYLES` with a comment so the team knows which ones aren't rule-based.
