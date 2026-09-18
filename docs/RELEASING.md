# Releasing

## Versioning

The project follows Semantic Versioning.

Production releases use tags in the form:

`vMAJOR.MINOR.PATCH`

The version in `package.json` must match the release tag without the leading `v`.

## Release gates

A production release requires:

1. syntax validation;
2. full Node.js test suite;
3. CLI smoke test;
4. Windows PowerShell 5.1 launcher parse test;
5. portable-package build;
6. smoke test executed from the packaged runtime;
7. expected HTML/JSON/RAG outputs;
8. SHA-256 checksum generation;
9. release notes;
10. immutable Git tag.

## Portable package

The official release asset is:

`pbi-profiling-v<version>-windows-portable.zip`

The package contains the application runtime, documentation, schemas, examples, Windows launcher, Power BI Desktop launcher script and the pinned upstream runtime source required for execution.

It excludes development-only material such as:

- `.git`;
- GitHub workflow metadata;
- test suites;
- `node_modules`;
- local output directories;
- coverage data.

## Release automation

The release workflow:

- checks out `main` with recursive submodules;
- reruns quality gates;
- stages the portable package;
- profiles a synthetic PBIP using the staged package;
- verifies `profile.html`, `profile.json` and `profile.rag.jsonl`;
- creates the ZIP;
- generates `SHA256SUMS.txt`;
- creates the immutable Git tag;
- publishes the GitHub Release and assets.

## Hotfixes

A hotfix increments PATCH and must pass the same release gates. Release artifacts are never overwritten in place.
