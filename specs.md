# Wireframe Prototype — Specs (CS 356, Part 1)

This is a team assignment. AI use during the build is encouraged and expected.

Reference: two example wireframes from the teaching-skills example project (one low scoring, one high scoring).

## Wireframe prototype description

### The wireframe

A working website at a URL the instructor can open. Requirements:

- **True wireframe fidelity.** Black and white only, one font, generic boxes. No color, no imagery, no typographic styling. At this rung you are testing structure, and anything prettier gets in the way.
- **Every information block from your card sort is present.** Leaves are labeled placeholders with a clear end state — a placeholder page or a "you selected X" message, your choice — so it is always unambiguous which block a user reached.
- **Two categorizations of the same blocks.** Single source, multiple views: two different ways to find the same information. PMEST is a useful lens for the second categorization; you do not have to name facets. Coverage rule: every block must be reachable in at least one view — not necessarily every view. Some blocks legitimately fit only one organization.
- **At least two levels of hierarchy**, grounded in your card sort analysis. Your categories and labels come from that study, not from intuition.
- **Click-through navigation** down the hierarchy to select a block.
- **Click recording with an exportable log** — downloadable or copyable JSON or CSV.

### Bonus credit — test mode

Show a scenario, the participant clicks OK, a timer starts, clicks are recorded, and when they reach an end of the hierarchy the endpoint is recorded and the next task begins. All 10 of your task scenarios, in randomized order, with results that persist for later review. This becomes the instrument for Part 2, so it pays for itself.

## What to turn in for Part 1

1. The URL.
2. A paragraph of rationale: how your categories and hierarchy derive from your card sort, and what your two categorizations are.

## Grading

The wireframe is graded on the Prototype Rubric: Functional 18, Visual 13, IA 13, Grounded in your previous study 16 = **60 points**.

### Prototype Rubric (60)

#### Met the functional spec (18 pts)
Did the prototype do what it was supposed to do? Expectations rise with the fidelity required by this assignment.

| Rating | Pts | Description |
|---|---|---|
| Skilled | 18 | The prototype meets every functional requirement in the assignment spec, and the functionality works reliably: a user can exercise each required behavior without workarounds, errors, or coaching. |
| Competent | 14 | The prototype meets the functional requirements with minor gaps or rough edges: a required behavior is incomplete, unreliable, or needs explanation to use, but the core functionality is present and working. |
| Beginning | 9 | Significant required functionality is missing or does not work; the prototype demonstrates the idea but cannot deliver the behaviors the spec requires. |
| Missing | 0 | No working prototype was submitted, or it cannot be loaded or run as required. |

#### Met the visual design spec (13 pts)
Do the visual elements look like they were designed and executed with intention and skill?

| Rating | Pts | Description |
|---|---|---|
| Skilled | 13 | Visual execution is skilled at this assignment's fidelity level: at wireframe fidelity, layout and visual hierarchy do the work and clearly support the user's goals; at higher fidelity, color is coherent and both color and layout actively support the user experience. |
| Competent | 10 | Visual execution is adequate but shows choices made without full intention: inconsistent layout, visual hierarchy that muddles priority, or (at higher fidelity) color that decorates rather than supports the experience. |
| Beginning | 7 | Visual choices impede the user experience: layout fights the content, hierarchy is unreadable, or (at higher fidelity) color is incoherent. |
| Missing | 0 | The required visual elements are absent, or the submission ignores the assignment's fidelity constraints. |

#### Met the information architecture design spec (13 pts)
Does the information architecture look like it was designed and executed with intention and skill?

| Rating | Pts | Description |
|---|---|---|
| Skilled | 13 | There are multiple reasonable ways to find things, and each way makes sense for the content and the users. Categories hold together; the hierarchy reflects deliberate design decisions. |
| Competent | 10 | The information architecture is present and mostly reasonable, but shows gaps in intention: a categorization that is arbitrary in places, or an alternate path that exists but does not genuinely help users find things. |
| Beginning | 7 | The information architecture looks improvised rather than designed: a single path to content, or categories that do not hold together. |
| Missing | 0 | The required information architecture elements are absent. |

#### Grounded in the results of the previous study (16 pts)
Can you articulate how the previous study's results informed this design — and can I see it in the prototype?

| Rating | Pts | Description |
|---|---|---|
| Skilled | 16 | The rationale cites specific findings from the previous study and connects each to a concrete design decision, and those decisions are visible in the prototype itself — the words and the artifact agree. The information architecture is not just reasonable; it is demonstrably grounded in the needs of your users. |
| Competent | 13 | The rationale connects the previous study to the design, but the connections are partly generic, or some claimed decisions are not actually visible in the prototype. The grounding is real but thin in places. |
| Beginning | 8 | The rationale gestures at the previous study without specific findings, or the prototype's design shows no visible relationship to what the study found. The design may be reasonable, but it is not grounded. |
| Missing | 0 | No rationale connecting the design to the previous study was submitted. |

**Total Points: 60**
