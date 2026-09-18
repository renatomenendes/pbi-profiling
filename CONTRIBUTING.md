# Contributing

## Engineering contract

Changes must preserve the project's core constraints:

- PBIP is the profiling input contract.
- Runtime remains zero-install: no npm dependencies are required to execute the profiler.
- Analysis of PBIP content is read-only.
- No corporate or customer artifacts may be committed.
- Facts, heuristics and user-supplied business context remain explicitly separated.
- Runtime imports of `pbi-lineage-lenz` remain pinned and attributable.
- Changes must not weaken validation merely to make an invalid project continue.

## Development setup

Clone with submodules:

```bash
git clone --recurse-submodules https://github.com/renatomenendes/pbi-profiling.git
cd pbi-profiling
git submodule update --init --recursive
```

No `npm install` is required.

Run the quality gates:

```bash
node ./scripts/check.js
node ./scripts/test.js
node ./src/cli.js --help
```

## Pull requests

A pull request should:

1. describe the confirmed problem or requested capability;
2. identify invariants that must remain unchanged;
3. include tests for the changed contract;
4. keep unrelated refactoring out of the change;
5. update user-facing documentation when behavior changes;
6. pass all CI jobs before merge.

## Fixtures and privacy

Use only synthetic fixtures or openly licensed upstream examples. Never commit:

- real PBIX/PBIP projects;
- corporate file names;
- internal SharePoint/OneDrive paths;
- screenshots containing private identifiers;
- credentials or access tokens.

## Releases

Release preparation and publication are described in `docs/RELEASING.md`.
