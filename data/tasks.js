// Tree-test scenarios. Source: "Tree Test Tasks - Sheet1.csv" in this folder. Blank tasks are skipped.
//
// text:               the scenario shown to the participant (user's words, no category labels)
// expectedFirstClick: the first click you predict, written exactly as the click log records it,
//                     e.g. "Explore", "Style: Classic", "Location: Provo",
//                     "Popular search: Outside catering allowed"
// expected:           the facets a participant should have applied when they press "I think I'm done".
//                     Each entry is one part. Score = parts satisfied / total parts (0 to 1).
//
// Parts you can use (values must match the labels on the Explore page):
//   { facet: "style", value: "Classic" }
//   { facet: "city", value: "Provo" }
//   { facet: "feature", value: "Sparklers allowed" }
//   { facet: "access", value: "Wheelchair accessible" }
//   { facet: "av", value: "Projector" }
//   { facet: "parking" }                                    Designated lot
//   { facet: "decor", value: "Cake table" }                 one specific Decor item
//   { facet: "decorGroup", group: "Aesthetics", min: 1 }    any `min` or more items from a Decor group
//   { facet: "price" }                                      price slider moved at all; add min / max for limits
//   { facet: "capacity", max: 200 }                         capacity slider: upper end at or below 200
//   { anyOf: [ part, part ] }                               either part counts for full credit
window.TASKS = [
  { id: "T1",
    text: "You're looking for a venue with a staircase, columns, and a ballroom.",
    expectedFirstClick: "Style: Classic",
    expected: [{ facet: "style", value: "Classic" }] },
  { id: "T2",
    text: "You have a large family and want to make sure there's enough space for them to park.",
    expectedFirstClick: "Explore",
    expected: [{ facet: "parking" }] },
  { id: "T3",
    text: "You're wanting a minimalistic venue, and you are looking forward to an exciting exit and a delicious cake.",
    expectedFirstClick: "Explore",
    expected: [
      { facet: "style", value: "Modern" },
      { facet: "feature", value: "Sparklers allowed" },
      { facet: "decor", value: "Cake table" },
    ] },
  { id: "T4",
    text: "You're trying to find your perfect venue at the perfect price for you.",
    expectedFirstClick: "Explore",
    expected: [{ facet: "price" }] },
  { id: "T5",
    text: "You want a whimsical wedding outside with lots of flowers.",
    expectedFirstClick: "Explore",
    expected: [
      { anyOf: [{ facet: "style", value: "Outdoors" }, { facet: "feature", value: "Outdoors" }] },
      { facet: "decor", value: "Greenery / florals" },
    ] },
  { id: "T6",
    text: "You're planning a wedding with lots of activities for guests.",
    expectedFirstClick: "Explore",
    expected: [{ facet: "decorGroup", group: "Specialty stations", min: 2 }] },
  { id: "T7",
    text: "You want an intimate setting for a small group.",
    expectedFirstClick: "Explore",
    expected: [{ facet: "capacity", max: 200 }] },
  { id: "T8",
    text: "You live in provo and your grandma wants to come to the wedding, but she can't walk very well and sometimes uses a mobility device to get around.",
    expectedFirstClick: "Location: Provo",
    expected: [
      { facet: "city", value: "Provo" },
      { facet: "access", value: "Wheelchair accessible" },
    ] },
  { id: "T9",
    text: "You're a photographer, so you want your venue to look good in photos.",
    expectedFirstClick: "Style: Luxury",
    expected: [
      { facet: "style", value: "Luxury" },
      { facet: "decorGroup", group: "Aesthetics", min: 1 },
      { facet: "decor", value: "Photo booth / backdrop" },
    ] },
  { id: "T10",
    text: "Your uncle owns a restaurant and is bringing a feast as a wedding gift.",
    expectedFirstClick: "Popular search: Outside catering allowed",
    expected: [{ facet: "feature", value: "Outside catering allowed" }] },
];
