# Architecture

## Runtime architecture

```text
PBIP folder
   │
   ▼
read-only project intake
   │
   ▼
pbi-lineage-lenz (pinned source)
   │
   ├─ TMDL
   ├─ PBIR
   ├─ DAX
   ├─ Power Query/M
   ├─ sources
   └─ dependency graph
   │
   ▼
pbi-profiling normalization
   │
   ├─ usage
   ├─ structural importance
   ├─ complexity
   ├─ health
   ├─ maintenance
   ├─ source resolution
   ├─ business context
   └─ analytical opportunities
   │
   ▼
profile contract
   │
   ├─ profile.html
   ├─ profile.json
   └─ profile.rag.jsonl
```

## Local application

The browser UI is served by a dependency-free Node.js HTTP server bound to loopback only.

The server:

- stages browser-selected PBIP files in a temporary workspace;
- validates the project before profiling;
- serializes profiling jobs;
- exposes generated artifacts only through the session token;
- deletes temporary application files on shutdown.

## PBIX boundary

PBIX is deliberately outside the profiling engine.

The optional PBIX launcher:

1. receives the selected PBIX through the local loopback application;
2. stages a temporary local copy;
3. opens that copy with the installed Power BI Desktop;
4. instructs the user to save the project as PBIP.

Power BI Desktop remains the authority for PBIX → PBIP materialization.

## Upstream dependency

The runtime uses a pinned source dependency:

`JonathanJihwanKim/pbi-lineage-lenz@7e2c61cac2f5e0ca6e7135df17a6918c89c42aec`

The source repository uses a Git submodule during development. Official release packaging materializes the required upstream source into the portable ZIP so end users do not need Git or submodule commands.

## Design invariants

- PBIP analysis is read-only.
- Runtime requires no npm-installed package.
- Facts, heuristics and explicit business context remain distinguishable.
- Invalid structural inputs fail before report generation.
- Generated HTML remains self-contained.
- No customer-specific vocabulary is embedded in the generic profiling engine.
