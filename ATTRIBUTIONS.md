# Attributions

`pbi-profiling` depends on and selectively adapts ideas from open-source Power BI tooling.

## Runtime dependencies

### PBI Lineage Lenz

- Repository: https://github.com/JonathanJihwanKim/pbi-lineage-lenz
- Evaluated commit: `7e2c61cac2f5e0ca6e7135df17a6918c89c42aec`
- Packages: `@pbi-lineage-lenz/core`, `@pbi-lineage-lenz/viewer`
- License: MIT
- Copyright: Jihwan Kim
- Use: PBIP discovery primitives, TMDL/PBIR/DAX/M parsing, physical-source resolution, graph/lineage, serializable viewer model.

The original MIT license remains applicable to those packages.

## Approved sources for selective adaptation

### pbi-doc-generator

- Repository: https://github.com/djrien-ai/pbi-doc-generator
- Evaluated commit: `1141d7c535beb956bf945c5737923ce97f0c161d`
- License: MIT
- Intended use: page wireframe and report data-role presentation patterns.

Any adapted source file will carry a local provenance header identifying the original file and commit.

### pbi-semantic-doc

- Repository: https://github.com/ViciusLio/pbi-semantic-doc
- Evaluated commit: `3e653828e4957ba7fb698ad92b1ff8bf4f791182`
- License: MIT
- Intended use: complexity and RAG/documentation output concepts or selectively adapted implementation.

Any adapted source file will carry a local provenance header identifying the original file and commit.

## Reference only — no code reuse

### pbir.tools

- Repository: https://github.com/maxanatsko/pbir.tools
- License: Custom Non-Commercial License
- Status: benchmark/reference only. No code, template, or implementation may be copied or adapted because derivative works require explicit author consent and commercial use is restricted.

## Project-specific code

The profiling model, evidence classification, value/usage/relevance analysis, onboarding runbook, health model and analytical-opportunity layer are original `pbi-profiling` components unless a source file states otherwise.
