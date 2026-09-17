# Semantic generalization contract

`pbi-profiling` must remain useful across unrelated PBIP projects without carrying assumptions from a pilot dashboard into the core engine.

## Separation of concerns

The analytical layer uses four evidence classes, in descending order of structural strength:

1. **PBIP structure** — data types, relationships, model objects and source lineage.
2. **Report usage** — visual roles, visual types and observed bindings.
3. **Generic semantic vocabulary** — a deliberately small bilingual vocabulary for analytical concepts such as time, state, duration, identifier and freshness.
4. **Optional project hints** — terms or explicit `Table[Column]` annotations from `pbi-profiling.config.json`.

Business meaning remains a fifth, separate layer and belongs only to `pbi-profiling.context.json`.

## Domain-neutral default

The default engine must not contain nouns tied to an industry, customer, technology estate or dashboard. Examples of prohibited built-in assumptions include specific equipment classes, organizational units, suppliers, products, municipalities, customers or operational states such as online/offline.

A text field can still become an entity/group signal through structural evidence such as:

- participation in a model relationship;
- use as a category, axis, legend, group, row or slicer field;
- a generic identifier term such as `id`, `key`, `code` or `name`.

A temporal field can be recognized from its data type even when its name has no semantic meaning. Numeric signals are type-driven. DAX time-intelligence and time-series visual types remain structural evidence.

## Optional semantic configuration

`pbi-profiling.config.json` is configuration, not documentation.

```json
{
  "schemaVersion": 1,
  "analysis": {
    "semanticHints": {
      "mode": "extend",
      "terms": {
        "state": ["mode"]
      },
      "columns": {
        "FactEvents[ObservedAt]": ["temporal"]
      }
    }
  }
}
```

Supported categories are:

- `temporal`
- `state`
- `duration`
- `entity`
- `freshness`

Modes:

- `extend`: generic vocabulary remains active and local terms are added;
- `replace`: generic vocabulary is disabled and only configured terms are used for name-based semantics.

Structural evidence from types, relationships, visual roles and DAX is never disabled by `replace`.

## Explainability

Every inferred column signal records its evidence basis. Current evidence labels include:

- `data-type:temporal`
- `data-type:numeric`
- `relationship-key`
- `visual-grouping-role`
- `default-lexicon`
- `custom-semantic-term`
- `explicit-column-hint`

The runbook also reports whether semantic configuration was provided, its basename, mode, number of custom terms and number of explicitly annotated columns. Absolute config paths are not persisted in the profile.

## Test invariant

The public test suite must include multiple synthetic domains and a negative-domain test. A noun associated with one pilot domain must not become a semantic signal merely because it exists as a column name. The same noun may become a signal when supported structurally or explicitly supplied through project configuration.

This invariant prevents a successful pilot from silently becoming the ontology of the product.
