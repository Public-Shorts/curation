# Festival Selection Definition

This document is the single source of truth for how the **festival selection** is computed. All platforms (curation, frontend, playback, backend) must follow this definition.

## Overview

A film is part of the **festival selection** if it meets **any** of the inclusion criteria and **none** of the exclusion criteria:

```
Festival Selection = (Highlighted OR Score >= Threshold) AND NOT Vetoed
```

## 1. Weighted Collective Score

Each submitted film receives a **collective score** (0-100%) derived from all curator reviews using a weighted system.

### Review Values

Each curator votes on a film with one of three options:

| Vote       | Value |
| ---------- | ----- |
| Selected   | 1.0   |
| Maybe      | 0.5   |
| Rejected   | 0.0   |

### Curator Weighting

Not all votes count equally. Each curator's vote is weighted based on two factors:

**Volume Score** (experience): Curators who have reviewed more films carry more weight, using a logarithmic scale to reward experience without letting any single curator dominate.

```
baseWeight = log10(totalReviews + 1) * volumeExponent
```

**Bias Correction** (tendency penalty): Curators who approve much more (or less) than average have their votes asymmetrically adjusted to counterbalance their tendency:

- If a curator approves **more** than average: their "selected" votes count **less**, their "rejected" votes count **more** (because rare rejections from a lenient curator are more meaningful).
- If a curator approves **less** than average: their "selected" votes count **more**, their "rejected" votes count **less** (because rare approvals from a strict curator are more meaningful).
- "Maybe" votes are always weighted at the base weight with no correction.

### Score Calculation

For each film, the score is computed as:

```
score = (sum of value * weight for each review) / (sum of weights) * 100
```

### Selection Threshold

A film is **selected by score** if its weighted score meets or exceeds the **selection threshold**, configurable in Festival Settings (default: **60%**).

There is also a **maybe threshold** (default: 35%) used in the curation UI to distinguish between "maybe" and "rejected" films, but it does not affect the final selection.

### Algorithm Parameters

All parameters are configurable in the Sanity **Festival Settings** document under the "Scoring Algorithm" group:

| Parameter          | Default | Description                                               |
| ------------------ | ------- | --------------------------------------------------------- |
| Selected Threshold | 60%     | Minimum score for a film to be selected                   |
| Maybe Threshold    | 35%     | Minimum score for "maybe" status (UI only, not selection) |
| Volume Exponent    | 1       | How much reviewer experience affects vote weight          |
| Bias Correction    | 2       | Correction strength for extreme voting tendencies         |

## 2. Curator Highlights

Any curator can **highlight** a film. Highlighted films are **automatically included** in the festival selection regardless of their collective score.

- Highlights are stored per curator (each curator has their own highlights list).
- A highlighted film receives a **display score of 100** in the selection.
- A film only needs to be highlighted by **one** curator to be included.

## 3. Veto

Admin curators can **veto** a film to exclude it from the selection. A veto **overrides both** the score-based selection and curator highlights.

Each veto includes:
- **Scope**: vetoed from cinema screenings, TV/playback, or both
- **Reason**: text explanation for the veto
- **Who** vetoed and **when**

A film is excluded from the selection if it is vetoed from **either** cinema or TV (or both).

## Selection Priority

The rules are applied in this order:

1. **Collect highlighted films** from all curators -> add to selection
2. **Compute weighted scores** for all reviewed films -> add films meeting the threshold to selection
3. **Remove vetoed films** from selection -> these are excluded no matter what

## Sanity Data Model

The computed selection is stored as a `festivalSelection` document in Sanity with:

| Field              | Description                                       |
| ------------------ | ------------------------------------------------- |
| `films`            | Array of `{ film, selectionScore }` references    |
| `highlightCount`   | Number of films included via highlights            |
| `scoreCount`       | Number of films included via score threshold       |
| `vetoedCount`      | Number of films excluded by veto                   |
| `totalCount`       | Final number of selected films                     |
| `selectedThreshold`| The threshold value used for this computation      |
| `computedAt`       | Timestamp of the last computation                  |

## Source of Truth

The canonical implementation lives in:
- **Selection logic**: `meta-categories/src/core/selection-filter.ts` (`computeSelectedFilmIds`)
- **Scoring utilities**: `curation/src/lib/utils/scoring.ts`
- **Sanity schemas**: `backend/schemaTypes/festivalSettings.ts`, `backend/schemaTypes/festivalSelection.ts`

Any new platform or feature that needs to determine the festival selection should either:
1. Read the computed `festivalSelection` document from Sanity, or
2. Re-use the `computeSelectedFilmIds` function from `meta-categories`
