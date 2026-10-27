# Venue data field guide (audit reference, 2026-10-26)

How the venue data flows, what each spreadsheet column means, and which Explore filter reads it.

**Flow:** Google Sheet "Wedding Reception Project" → *Venues* tab → `data/venues.csv` (synced 2026-10-26: identical to the Drive sheet) → `tools/build_data.py` → `data/venues.js` → hi-fi site (`site/`) and wireframe.

**Origin:** an AI tool collected every row from each venue's official website. Treat any value as unverified until it is checked against that site.

## Filters (most important)

Each filter is worked out in `build_data.py` by keyword-matching free text, so a wrong word in a cell gives a wrong filter. A filter is **true only when the official site says the thing is offered and included**. A paid add-on doesn't count, except in Decor / Other, where it counts as "For rent". A blank cell means no.

| Filter group | Option | True when the official site says… | Columns read today | Rule today |
|---|---|---|---|---|
| Price | slider $0–$10k | the venue rental price (or range) | Standard Price Range | min/max of every `$` amount in the cell |
| Capacity | slider 0–1000 | maximum **seated** guests | Seated Capacity | largest number in the cell |
| City | 15 cities | the venue's city | City | cell as written |
| Style | Classic, Luxury, Modern, Outdoors, Rustic | *(subjective)* | Description | hand-tagged in `STYLES` using the rules in decisions.md |
| Accessibility options | Wheelchair accessible | wheelchair / handicap access | Accessibility | "wheelchair" or "handicap" |
| | Elevator | an elevator | Accessibility | "elevator" |
| | ADA restrooms | ADA restrooms | Accessibility | "ADA" |
| | Accessible parking | accessible / handicap parking | Accessibility | "accessible parking" |
| Audio/Visual | Microphone | a microphone is provided | sound system, extras, Other Decor Included | "microphone" |
| | Projector | a projector / projection | same | "projector", "projection" |
| | Sound system | an in-house sound system | sound system | cell starts with "Yes" |
| | TV | TVs / screens / HD displays | same | "TV", "television", "HD displays" |
| Features | Bridal room | a bridal room or suite | Bride/Groom Rooms | "bride" / "bridal" |
| | Groom's room | a groom's room or suite | Bride/Groom Rooms | "groom" |
| | Cleanup crew | cleanup is included | cleanup crew | cell starts with "Included" |
| | Event coordinator | a coordinator is included (not only paid) | Event Coordinator | any line without a `$` |
| | Indoors / Outdoors | indoor / outdoor event space | outside/inside | Inside, Outside or Both |
| | Linens included | linens are included | Linens Included | TRUE |
| | Outside catering allowed | you may bring your own / any caterer | Catering | phrases like "outside caterer", "own caterer", "any vendor" |
| | Sparklers allowed | sparkler exits are allowed | sparklers allowed | cell starts with "Yes" |
| Decor (Included / For rent) | Centerpieces, Ceremony arch / backdrop, Draping / chair covers, Fireplace, Greenery / florals, Signs / easels, Candles / lanterns, Chandeliers, String / bistro lights | the item is included, or offered for rent | Other Decor Included, Other Decor for Rent, extras (lines with `$` count as rent) | keyword list `DECOR` |
| Other (Included / For rent) | Cake table, Drink / beverage station, Firepit, Photo booth / backdrop, Piano, Sweetheart table | same | same | same |

Shown on the venue page but no longer a filter: Parking (`parking?`, decision D4), Standing capacity.

## Every column

| Column | What it holds | Feeds |
|---|---|---|
| Photo? | unused (empty) | — |
| Venue Name | official name | page title, id |
| link | official website (the only allowed source) | Visit website |
| Description | one-paragraph summary | search, Style tags |
| Standard Price Range | venue rental price or range | **Price filter** |
| Packages and Prices | named packages with prices and contents | venue page |
| Seated Capacity / Standing Capacity | guest counts | **Capacity filter** / venue page |
| Time slots, Length of Rental | days, hours, rental length | venue page |
| Style | the venue's own style words | venue page, search (not the Style filter) |
| Linens Included | TRUE / FALSE | **Features** |
| Other Decor Included / Other Decor for Rent | one item per line | **Decor, Other**, A/V |
| outside/inside | Inside / Outside / Both | **Features** |
| sparklers allowed | Yes / No + details | **Features** |
| parking? | parking details | venue page |
| Full Address, City | address and city | **City filter** |
| sound system | Yes / No + equipment | **A/V** |
| extras | add-ons (with `$` = paid) and other notes | **Decor, Other, A/V** |
| cleanup crew | Included / paid / details | **Features** |
| Accessibility | one item per line | **Accessibility options** |
| Deposit Policy, Prep Area, Alcohol policy, Restrictions, Important Notes | policies and notes | venue page |
| Catering | catering rules | **Features** (Outside catering) |
| Event Coordinator | staff and services (with `$` = paid) | **Features** |
| Bride/Groom Rooms | rooms | **Features** |
| Contact Information | phone / email | Call button, venue page |

## Known problems going into the audit

- 38 cells hold filler text ("No pricing information stated on the official website") instead of being blank.
- Junk values exist, for example a template email (`info@mysite.co.il`) and a garbled fee ("$75 0").
- Out-of-area rows: Stone Gate (Concord, VA; already excluded), The Villa at the Retreat (Carriere, MS), Walker Farms (Riverton, Salt Lake County), Sun River Gardens (garden center).
