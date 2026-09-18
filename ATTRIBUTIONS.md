# Attributions

`pbi-profiling` depends on and selectively adapts ideas from open-source Power BI tooling.

## Pinned runtime source dependency

### PBI Lineage Lenz

- Repository: https://github.com/JonathanJihwanKim/pbi-lineage-lenz
- Pinned commit: `7e2c61cac2f5e0ca6e7135df17a6918c89c42aec`
- Source modules used: `packages/core/src` and `packages/viewer/src/viewerModel.js`
- License: MIT
- Copyright: Jihwan Kim
- Integration: Git submodule at `vendor/pbi-lineage-lenz`; runtime imports the audited source directly from the pinned submodule and does not install or resolve npm packages.
- Use: PBIP discovery primitives, TMDL/PBIR/DAX/M parsing, physical-source resolution, dependency graph/lineage facts and the serializable viewer model.

The original MIT license remains applicable to the upstream source. The submodule preserves the upstream repository history and license verbatim.

The upstream `handoff` package was evaluated and used in earlier development versions, but it is no longer required at runtime because it invokes `esbuild`. The production lineage view is now an original dependency-free renderer in `src/report/lineage.js`, built from the normalized profiling contract. This change allows execution on locked-down corporate workstations without `npm install`.

## Approved sources for selective adaptation

### pbi-doc-generator

- Repository: https://github.com/djrien-ai/pbi-doc-generator
- Evaluated commit: `1141d7c535beb956bf945c5737923ce97f0c161d`
- License: MIT
- Useful reference: page wireframes, report layout presentation and visual data-role documentation.

The current `pbi-profiling` page wireframe is an original implementation over PBIR position metadata; no `pbi-doc-generator` source code has been copied. Any future adapted source file will carry a local provenance header identifying the original file and commit.

### pbi-semantic-doc

- Repository: https://github.com/ViciusLio/pbi-semantic-doc
- Evaluated commit: `3e653828e4957ba7fb698ad92b1ff8bf4f791182`
- License: MIT
- References evaluated: documented complexity-index methodology and `pbi_semantic_doc/rag_generator.py` chunk design.
- Local use:
  - `src/profile/complexity.js` uses the public complexity-index idea as a conceptual baseline, but implements a different transparent formula with exposed components, DAX nesting, dependencies and structural density;
  - `src/export/rag.js` adopts the one-logical-entity-per-JSONL-chunk concept, extended with report usage, structural importance, health findings, business context and analytical opportunities.

Both local files carry provenance headers. No parser, HTML generator or lineage implementation from `pbi-semantic-doc` has been copied.


### Horizun PBI MCP

- Repository: https://github.com/HorizunGroup/horizun-pbi-mcp
- Evaluated architecture: `pbip/pbix_to_pbip.py`, `pbip/pbix_reader.py`, `powerbi/tmdl_export.py`, and Power BI Desktop workspace discovery.
- License: Apache-2.0.
- Useful reference: split PBIX conversion into report extraction plus official TMDL serialization from the local Analysis Services model exposed by Power BI Desktop.

The local implementation in `scripts/windows/convert-pbix.ps1` is an original PowerShell/Node implementation designed for the repository's zero-install constraint. It does not copy the Python implementation. The architectural decision to avoid decoding the compressed `DataModel` directly and instead use Microsoft's `TmdlSerializer` was validated against this project and is explicitly attributed here.

### PBI Inspector

- Repository: https://github.com/NatVanG/PBI-Inspector
- Evaluated commit: `197f6637174861e7f0f866be728323943ceee2a0`
- License: MIT.
- Useful reference: local desktop workflow with PBIX/PBIP selection, temporary output and browser-oriented results.

The `pbi-profiling` local UI is an original dependency-free HTTP/browser application. No WinForms or PBI Inspector source code is copied.

## Reference only — no code reuse

### pbir.tools

- Repository: https://github.com/maxanatsko/pbir.tools
- License: Custom Non-Commercial License
- Status: benchmark/reference only. No code, template, or implementation may be copied or adapted because derivative works require explicit author consent and commercial use is restricted.

## Test fixture provenance

The integration test contains a minimal textual fixture adapted from `pbi-lineage-lenz/samples/sample-pbip` at the pinned commit above. The fixture is covered by the upstream MIT license and carries an inline provenance header.

## Project-specific code

The profiling model, evidence classification, usage analysis, structural-importance model, business-context contract, analytical-relevance analysis, onboarding runbook, health model, page-wireframe renderer, dependency-free lineage renderer, HTML visual system and analytical-opportunity layer are original `pbi-profiling` components unless a source file states otherwise.
