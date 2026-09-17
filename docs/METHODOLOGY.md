# Profiling methodology

This document defines what the `pbi-profiling` indicators mean, how they are computed, and — equally important — what they do **not** mean.

The methodology is deterministic for a given normalized PBIP viewer model and context sidecar. No network service, LLM or row-level data is involved in these indicators.

## Evidence classes

Every conclusion belongs to one of three classes:

1. **Extracted fact** — represented directly in PBIP/TMDL/PBIR/M/DAX or derived by deterministic dependency resolution. Examples: a measure expression, a visual binding, a relationship, a physical source, a page visibility state.
2. **Structural inference** — a deterministic heuristic over extracted facts. Examples: structural centrality, complexity, a temporal/state signal, an analytical opportunity candidate.
3. **Declared business context** — human-authored metadata from `pbi-profiling.context.json`. Examples: business purpose, owner, grain, SLA and metric definition.

Structural inference is never promoted to declared business truth.

## Structural importance

Structural importance estimates how central an object is to the current report/model. It is **not business value**.

### Measures

All components are normalized to `[0, 1]` within the analyzed project.

```text
measure_importance =
    0.35 * visual_breadth
  + 0.25 * page_breadth
  + 0.25 * direct_reverse_dependency_fanout
  + 0.15 * transitive_reverse_dependency_fanout
```

Where:

- `visual_breadth`: observed visual references divided by the maximum among measures;
- `page_breadth`: distinct page references divided by report page count;
- `direct_reverse_dependency_fanout`: measures directly depending on the measure, normalized by the project maximum;
- `transitive_reverse_dependency_fanout`: all downstream dependent measures reachable through the dependency graph, normalized by the project maximum.

### Tables

```text
table_importance =
    0.30 * visual_breadth
  + 0.20 * page_breadth
  + 0.15 * object_breadth
  + 0.15 * relationship_degree
  + 0.20 * dependent_measure_breadth
```

This makes the score useful for **within-project prioritization**. It must not be used to compare business importance between unrelated dashboards.

## DAX complexity

Complexity is a structural comprehension indicator, not a quality grade.

### Per-measure components

```text
dax_complexity =
    0.25 * expression_length
  + 0.25 * pattern_breadth
  + 0.20 * dependency_breadth
  + 0.15 * nesting_depth
  + 0.15 * structural_density
```

Reference maxima used for normalization:

- expression length: 800 characters;
- pattern groups: number of defined DAX pattern groups;
- dependency breadth: 12 references;
- parenthesis nesting depth: 8;
- structural density: 16 units.

Pattern groups include context modification, iterators, time intelligence, branching, virtual relationships and table construction. Structural density combines variables, multiline structure and function-call count.

Scores saturate at `1.0`; a value above a reference maximum does not keep increasing the component.

### Semantic-model complexity

```text
semantic_model_complexity =
    0.35 * average_measure_complexity
  + 0.20 * normalized_measure_count
  + 0.15 * normalized_table_count
  + 0.10 * normalized_relationship_count
  + 0.10 * normalized_column_count
  + 0.10 * normalized_calculated_object_count
```

### Report complexity

```text
report_complexity =
    0.20 * normalized_page_count
  + 0.40 * normalized_visual_count
  + 0.15 * normalized_bookmark_count
  + 0.10 * normalized_hidden_visual_count
  + 0.15 * normalized_field_binding_count
```

The combined indicator is the arithmetic mean of semantic-model and report complexity.

## Complexity and attention bands

The same descriptive bands are used for normalized structural indicators:

| Range | Band |
| --- | --- |
| `< 0.25` | low |
| `0.25 – < 0.50` | moderate |
| `0.50 – < 0.75` | high |
| `>= 0.75` | very-high |

Bands are navigation aids, not pass/fail gates.

## Maintenance attention

Maintenance attention answers a different question from health:

- **health**: is there an observable structural gap/problem?
- **maintenance attention**: where would a change deserve more review because of impact surface or comprehension cost?

For measures:

```text
maintenance_attention =
    0.40 * structural_centrality
  + 0.35 * dax_complexity
  + 0.15 * normalized_dependency_breadth
  + 0.10 * documentation_gap
```

`documentation_gap = 1` only when both are absent:

- TMDL measure description;
- explicit business definition/meaning in the optional context sidecar.

The profiler also lists operational source dependencies such as gateway requirements, native queries and parameterized connections. Their presence is not automatically a defect.

## Analytical relevance

Analytical relevance does **not** inspect rows or estimate statistical model performance. It scans structural signals that make certain analyses plausible candidates for later validation.

### Identifier normalization

Before name-based semantic matching, identifiers are tokenized across:

- CamelCase (`DurationHours` → `Duration Hours`);
- acronym boundaries;
- snake_case;
- kebab-case;
- punctuation;
- whitespace.

Type information is preferred where available. Name-based signals are treated as heuristics.

### Signals

Current signal families include:

- temporal columns and time-intelligence measures;
- status/state columns;
- duration/persistence columns;
- entity/group columns;
- freshness/arrival timestamps;
- numeric columns;
- time-series-oriented visual types.

### Capabilities

Signals are combined into structural capabilities such as:

- temporal analysis;
- state-transition analysis;
- persistence/duration analysis;
- peer comparison;
- freshness monitoring;
- seasonality analysis.

Capability strength is discrete and evidence-count based:

```text
0 signals  -> 0.00
1 signal   -> 0.35
2–3        -> 0.60
4–6        -> 0.80
7+         -> 1.00
```

Status thresholds:

- `>= 0.75`: `strong-structural-support`;
- `>= 0.40`: `partial-structural-support`;
- otherwise: `not-observed`.

### Analytical opportunities

The profiler currently produces candidates for:

- point anomaly detection;
- contextual anomaly detection;
- collective/persistent anomaly detection;
- state-transition monitoring;
- freshness anomaly detection;
- seasonal baseline/deviation analysis.

Opportunity status thresholds:

- `>= 0.75`: `supported-candidate`;
- `>= 0.40`: `candidate-needs-validation`;
- otherwise: `insufficient-structural-evidence`.

Every opportunity carries explicit prerequisites. Examples include validating grain, cadence, historical depth, allowed states and peer comparability.

An opportunity is **not** evidence that an ML/statistical model should be deployed.

## Confidence

For analytical capabilities/opportunities, confidence reflects how many independent structural evidence references support the candidate:

- 5+ references: high;
- 2–4: medium;
- 1: low;
- 0: none.

This is evidence convergence, not a probability.

## Health

Health findings are evidence-backed and enumerated. Current checks include:

- unresolved physical-source columns;
- hidden pages;
- malformed page definitions;
- visuals never shown;
- measures without observed usage;
- unresolved visual bindings;
- broken model references.

Counts in the health summary count finding categories by severity. Each finding retains its occurrence count and concrete evidence.

## Business context

`pbi-profiling.context.json` is the only source for manually asserted business metadata in the profiler.

The sidecar can document:

- dashboard purpose;
- audience and owner;
- operational use;
- business questions;
- refresh cadence/SLA/timezone;
- table grain and keys;
- metric business definitions;
- page purpose;
- source meaning/ownership;
- caveats and notes.

Annotations are matched against real PBIP objects. Unmatched annotations become warnings instead of being silently accepted.

## RAG export

`profile.rag.jsonl` uses one self-contained JSON object per logical entity. Dependencies and profiling results are pre-resolved to reduce downstream dependence on reparsing raw DAX.

Chunk types include technical entities, health findings, analytical opportunities and maintenance hotspots. No embeddings are generated by `pbi-profiling`; the artifact remains deterministic and provider-neutral.

## What requires local data validation

The following cannot be established from PBIP structure alone and remain explicitly outside structural inference:

- actual row grain and uniqueness;
- historical depth;
- observation cadence and missing intervals;
- distribution, variance and seasonality strength;
- class/event frequency;
- label availability;
- peer comparability;
- actual refresh latency;
- statistical anomaly thresholds;
- model accuracy or operational utility.

These are validation gates for the local-data phase, not assumptions made by the documentation layer.
