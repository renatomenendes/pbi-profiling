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

## Reference only — no code reuse

### pbir.tools

- Repository: https://github.com/maxanatsko/pbir.tools
- License: Custom Non-Commercial License
- Status: benchmark/reference only. No code, template, or implementation may be copied or adapted because derivative works require explicit author consent and commercial use is restricted.

## Test fixture provenance

The integration test contains a minimal textual fixture adapted from `pbi-lineage-lenz/samples/sample-pbip` at the pinned commit above. The fixture is covered by the upstream MIT license and carries an inline provenance header.

## Project-specific code

The profiling model, evidence classification, usage analysis, structural-importance model, business-context contract, analytical-relevance analysis, onboarding runbook, health model, page-wireframe renderer, dependency-free lineage renderer, HTML visual system and analytical-opportunity layer are original `pbi-profiling` components unless a source file states otherwise.
