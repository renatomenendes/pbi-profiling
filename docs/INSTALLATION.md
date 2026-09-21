# Installation

## Recommended distribution

Use the portable ZIP attached to the GitHub Release. Do not use GitHub's automatic source archive as the primary runtime package because the project depends on a pinned upstream Git submodule that is materialized into the official release package.

## Windows requirements

- Windows 10 or 11.
- Node.js 20 or newer available on `PATH`.
- Power BI Desktop only when using the optional PBIX launcher.
- No administrator rights are required.
- No `npm install`, Python installation or PowerShell ExecutionPolicy change is required.

## Install from a GitHub Release

1. Download `pbi-profiling-v<version>-windows-portable.zip`.
2. Download `SHA256SUMS.txt`.
3. Verify the ZIP hash.
4. In Windows Explorer, right-click the ZIP and choose **Extract All**.
5. Use the default destination or another user-writable folder.
6. Open the extracted `pbi-profiling-v<version>-windows-portable` folder.
7. Run `pbi-profiling.cmd`.

The official ZIP stores the application files directly at the archive root. With the standard Windows **Extract All** flow, the expected layout is:

```text
C:\projetos\
└── pbi-profiling-v1.0.1-windows-portable\
    ├── pbi-profiling.cmd
    ├── src\
    ├── docs\
    ├── schemas\
    └── vendor\
```

There must not be a second nested `pbi-profiling-v1.0.1-windows-portable` directory.

Example checksum validation in PowerShell:

```powershell
Get-FileHash .\pbi-profiling-v1.0.1-windows-portable.zip -Algorithm SHA256
Get-Content .\SHA256SUMS.txt
```

The calculated hash must match the release checksum exactly.

## Launch

Example:

```powershell
Set-Location C:\projetos\pbi-profiling-v1.0.1-windows-portable
.\pbi-profiling.cmd
```

The application starts a local loopback server and opens the browser automatically.

## Run directly from source

For development or source-based use:

```powershell
git clone --recurse-submodules https://github.com/renatomenendes/pbi-profiling.git
Set-Location .\pbi-profiling
git submodule update --init --recursive
node .\src\app.js
```

## Upgrade

Portable releases are side-by-side. Extract the new version to a new folder and validate it before removing the previous folder. No installer state or registry migration is required.
