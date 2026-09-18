# User Guide

## Supported workflow

The profiler analyzes PBIP projects.

If the source is PBIX:

1. Start `pbi-profiling`.
2. Select the PBIX.
3. Click **Abrir no Power BI Desktop**.
4. In Power BI Desktop, use **File > Save As > Power BI Project (.pbip)**.
5. Return to `pbi-profiling`.
6. Click **Selecionar pasta PBIP**.
7. Select the PBIP project root.
8. Confirm the structural validation summary.
9. Click **Gerar runbook**.
10. Open or export the generated artifacts.

If the project is already PBIP, start at step 6.

## Validation gate

Before profiling is enabled, the application requires:

- at least one TMDL file;
- at least one parsed semantic-model table;
- a structurally valid PBIP/PBIR partition.

A folder containing only metadata such as `.platform` or `definition.pbir` without a usable semantic model is rejected.

## Result actions

After a successful run:

- **Abrir runbook** opens the generated HTML in the browser;
- **Exportar HTML** downloads `profile.html`;
- **profile.json** downloads the structured profiling contract;
- **profile.rag.jsonl** downloads RAG-ready chunks.

The temporary application workspace is deleted when the local application shuts down. Export any artifact that must be retained.

## Optional business context

Place `pbi-profiling.context.json` in the PBIP root to provide explicit business meaning such as purpose, audience, grain or refresh expectations.

The profiler does not invent missing business context.

## Optional profiling configuration

Place `pbi-profiling.config.json` in the PBIP root to extend or replace semantic profiling hints.

Configuration changes heuristics; it does not turn heuristics into facts.

## Operational constraints

- The application is local and read-only with respect to PBIP content.
- The browser communicates only with the loopback server started by the application.
- PBIX is not converted programmatically.
- PBIT is not a profiling input.
