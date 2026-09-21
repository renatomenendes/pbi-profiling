# Changelog

All notable changes to `pbi-profiling` are documented here.

The project follows Semantic Versioning.

## [1.0.1] - 2026-09-21

Packaging hotfix for the Windows portable distribution.

### Fixed

- The official portable ZIP now stores runtime files at the ZIP root instead of wrapping them in an additional `pbi-profiling-v<version>-windows-portable` directory.
- Windows **Extract All** now produces exactly one application directory, with `pbi-profiling.cmd` directly inside it.
- CI now reproduces the Windows extraction layout and fails if an extra nested package directory is introduced again.
- Release smoke testing now executes the profiler from the same flat layout that end users receive after extraction.

No profiling-engine, PBIP validation, HTML, JSON or RAG behavior changed.

## [1.0.0] - 2026-09-18

First production release.

### Added

- PBIP profiling for semantic models and reports using TMDL and PBIR.
- Human-oriented, self-contained HTML runbook.
- Structured `profile.json` contract.
- RAG-ready `profile.rag.jsonl` export.
- TMDL, DAX, Power Query/M, relationship, page, visual and bookmark analysis.
- Physical-source resolution and lineage.
- Structural importance, complexity, usage, health and maintenance analysis.
- Analytical-opportunity detection with explicit evidence.
- Optional business-context and profiling-configuration sidecars.
- Local loopback application with PBIP folder intake.
- Optional PBIX launcher for opening an existing report in Power BI Desktop.
- Explicit PBIX → Power BI Desktop → Save As PBIP workflow.
- HTML, JSON and RAG export from the local application.
- Zero-install runtime contract: no `npm install`, Python, administrator rights or ExecutionPolicy changes.
- CI on Node.js 20, 22 and 24 plus Windows PowerShell 5.1 syntax validation.
- Portable GitHub Release package with pinned upstream runtime source materialized.

### Changed

- PBIP is the sole profiling input contract.
- Programmatic PBIX-to-PBIP conversion was removed from the production path after real-world validation in favor of the supported Power BI Desktop Save As workflow.

### Security and privacy

- Local application binds only to loopback.
- Session API is protected by a random token.
- Generated runbooks are self-contained and do not require a CDN.
- Corporate PBIP/PBIX artifacts are not part of the public repository or release fixtures.
