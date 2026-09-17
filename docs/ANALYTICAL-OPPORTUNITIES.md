# Analytical opportunity catalog

The profiler is a PBIP discovery and documentation product first. Analytical opportunities are a secondary, evidence-backed layer that points to analyses worth validating against row-level data and business context.

No single analytical technique is the default objective of a dashboard.

## Families

The current catalog deliberately spans multiple families:

| Family | Examples | Structural basis |
| --- | --- | --- |
| Descriptive | trend and temporal evolution | temporal fields, time-intelligence measures, series visuals |
| Process behavior | state transitions, duration and persistence | temporal + state signals, duration fields |
| Diagnostic | peer/group comparison | entity/group signals, numeric measures/columns |
| Data operations | freshness and arrival monitoring | freshness timestamps |
| Baseline modeling | seasonal or expected-behavior baseline | temporal structure, series visuals, time intelligence |
| Forecasting | future metric candidates | temporal + numeric co-occurrence, seasonality evidence |
| Anomaly detection | point, contextual and collective anomalies | temporal/numeric/entity/state/duration combinations |

The catalog may expand, but new families must be supported by generic structural evidence. A project-specific business use case belongs in `pbi-profiling.context.json`, not in the core catalog.

## Status

Every opportunity uses the same evidence-strength contract:

- `supported-candidate`: strong structural support;
- `candidate-needs-validation`: partial structural support;
- `insufficient-structural-evidence`: the PBIP alone does not support the candidate sufficiently.

These statuses are not business recommendations and are not model-performance estimates.

## Validation boundary

Before an opportunity becomes a real analytical initiative, validate at least the applicable items below:

- business question and actionability;
- grain and entity definition;
- timestamp semantics and ordering;
- observation cadence and missing intervals;
- historical depth;
- metric distribution and variance;
- state domain and transition rules;
- peer comparability;
- seasonality and regime changes;
- labels or ground truth when required;
- operational cost of false positives/negatives;
- baseline performance and monitoring strategy.

This keeps the runbook useful across sales, finance, operations, HR, technology, supply chain and other domains without turning one pilot use case into the product ontology.

## Compatibility

Existing public opportunity identifiers are preserved when their meaning remains the same, including:

- `point-anomaly`
- `contextual-anomaly`
- `collective-anomaly`
- `state-transition-monitoring`
- `seasonal-baseline`

New generic opportunities use additional stable IDs and a `family` property. Consumers should use IDs for identity and `family` for grouping.
