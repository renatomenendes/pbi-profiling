# Security Policy

## Supported versions

Security fixes are provided for the latest released major version of `pbi-profiling`.

| Version | Supported |
| --- | --- |
| 1.x | Yes |
| 0.x | No |

## Security model

`pbi-profiling` is designed for local, read-only analysis of Power BI project artifacts.

The local application:

- binds only to `127.0.0.1`;
- requires a random per-session token for API access;
- does not require administrator privileges;
- does not change PowerShell ExecutionPolicy;
- does not install npm or Python packages at runtime;
- does not use a CDN for generated runbooks;
- does not upload PBIP content to an external service;
- treats business context as explicit local input rather than inferred data.

The optional PBIX flow copies the selected PBIX into a temporary local workspace and opens it with the installed Power BI Desktop. The profiler does not convert PBIX programmatically.

## Reporting a vulnerability

Do not disclose a suspected vulnerability in a public issue if it contains exploitable details, credentials, private paths, or corporate data.

Use GitHub's private security-reporting mechanism when available. If private reporting is unavailable, open a minimal public issue requesting a private contact channel without including sensitive technical details.

A useful report should include:

- affected version;
- operating system;
- attack or failure scenario;
- minimal reproduction using synthetic data;
- expected and observed behavior;
- whether secrets, local files or generated artifacts could be exposed.

## Sensitive data

Never attach corporate PBIX/PBIP files, screenshots with confidential paths, credentials, access tokens, customer data or proprietary model definitions to public issues.
