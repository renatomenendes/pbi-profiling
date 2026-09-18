# Output Contracts

A successful profiling run produces three artifacts from the same normalized profile.

## profile.html

Primary human-oriented runbook.

Characteristics:

- self-contained and offline;
- no CDN dependency;
- interactive lineage;
- executive overview;
- semantic-model inventory;
- pages and visual inventory;
- DAX and Power Query/M visibility;
- source resolution;
- usage and structural importance;
- complexity, health and maintenance findings;
- analytical opportunities;
- optional business context.

Use **Exportar HTML** in the local application to retain the file outside the temporary runtime workspace.

## profile.json

Structured machine-readable contract.

Intended uses:

- audit;
- automated checks;
- downstream transformation;
- integration with internal tooling;
- regression comparison.

The schema is versioned and documented in `schemas/profile.schema.json`.

## profile.rag.jsonl

Retrieval-oriented JSON Lines output.

Each line represents a self-contained logical chunk such as:

- overview;
- table;
- measure;
- page;
- source;
- relationship;
- health finding;
- maintenance hotspot;
- analytical opportunity;
- business-context element.

The chunk schema is documented in `schemas/profile.rag.chunk.schema.json`.

## Data boundaries

Generated artifacts describe project metadata and model/report structure. They are not intended to export underlying business data rows.

Absolute workstation paths are not persisted in the structured profile by default.
