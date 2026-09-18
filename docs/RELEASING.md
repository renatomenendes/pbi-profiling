# Releasing

## Versioning

The project follows Semantic Versioning.

Production releases use immutable annotated tags in the form:

`vMAJOR.MINOR.PATCH`

The version in `package.json` must match the tag without the leading `v`.

Each release also requires:

`docs/releases/vMAJOR.MINOR.PATCH.md`

## Release gates

A production release requires:

1. syntax validation;
2. full Node.js test suite;
3. CLI smoke test;
4. Windows PowerShell 5.1 launcher parse test;
5. portable-package build;
6. smoke test executed from the staged package;
7. smoke test executed from the unpacked ZIP artifact;
8. expected HTML/JSON/RAG outputs;
9. SHA-256 checksum generation;
10. release notes;
11. immutable Git tag.

## Portable package

The official release asset is:

`pbi-profiling-v<version>-windows-portable.zip`

The package contains:

- application runtime;
- documentation;
- schemas and examples;
- Windows launcher;
- Power BI Desktop launcher script;
- pinned upstream runtime source required for execution;
- project and upstream licenses;
- release manifest.

It excludes development-only material such as:

- `.git`;
- GitHub workflow metadata;
- test suites;
- `node_modules`;
- local output directories;
- coverage data.

## Release automation

The generic release workflow is triggered by pushing a `v*` tag.

Before creating the tag:

1. update `package.json`;
2. update `CHANGELOG.md`;
3. create `docs/releases/<tag>.md`;
4. merge all release preparation into `main`;
5. confirm CI is green.

Then create and push the annotated tag:

```bash
git switch main
git pull --ff-only
git tag -a v1.0.1 -m "pbi-profiling v1.0.1"
git push origin v1.0.1
```

The release workflow checks out that exact tag and:

- verifies the tag version against `package.json`;
- reruns quality gates;
- verifies the pinned upstream commit;
- stages the portable package;
- profiles a synthetic PBIP using the staged package;
- creates the deterministic ZIP;
- generates `SHA256SUMS.txt`;
- unpacks the final ZIP;
- profiles the synthetic PBIP again from the unpacked runtime;
- rejects forbidden development content;
- uploads auditable workflow artifacts;
- publishes the GitHub Release and assets.

Existing releases are never overwritten.

## Hotfixes

A hotfix increments PATCH and must pass the same release gates.

Release artifacts and tags are immutable. If a published release is defective, publish a new version rather than replacing assets in place.
