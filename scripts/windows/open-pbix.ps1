$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

function Get-PowerBIDesktopExecutable {
    $candidates = New-Object System.Collections.Generic.List[string]

    if ($env:ProgramFiles) {
        $candidates.Add((Join-Path $env:ProgramFiles 'Microsoft Power BI Desktop\bin\PBIDesktop.exe'))
    }

    $programFilesX86 = [Environment]::GetEnvironmentVariable('ProgramFiles(x86)')
    if ($programFilesX86) {
        $candidates.Add((Join-Path $programFilesX86 'Microsoft Power BI Desktop\bin\PBIDesktop.exe'))
    }

    foreach ($key in @(
        'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\PBIDesktop.exe',
        'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\PBIDesktop.exe'
    )) {
        try {
            $value = (Get-ItemProperty -Path $key -ErrorAction Stop).'(default)'
            if ($value) {
                $candidates.Add([string]$value)
            }
        }
        catch {
        }
    }

    try {
        $command = Get-Command PBIDesktop.exe -ErrorAction Stop
        if ($command.Source) {
            $candidates.Add([string]$command.Source)
        }
    }
    catch {
    }

    try {
        $packages = @(Get-AppxPackage -Name Microsoft.MicrosoftPowerBIDesktop -ErrorAction Stop)
        foreach ($package in $packages) {
            if (-not $package.InstallLocation) {
                continue
            }
            $found = Get-ChildItem -Path $package.InstallLocation -Filter PBIDesktop.exe -File -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($found) {
                $candidates.Add($found.FullName)
            }
        }
    }
    catch {
    }

    foreach ($candidate in $candidates | Select-Object -Unique) {
        if ($candidate -and (Test-Path -LiteralPath $candidate -PathType Leaf)) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }

    throw 'Power BI Desktop executable was not found.'
}

$pbixEnvironment = [Environment]::GetEnvironmentVariable('PBI_PROFILING_PBIX')
if (-not $pbixEnvironment) {
    throw 'PBI_PROFILING_PBIX was not provided.'
}

$pbix = [System.IO.Path]::GetFullPath($pbixEnvironment)
if (-not (Test-Path -LiteralPath $pbix -PathType Leaf)) {
    throw "PBIX file does not exist: $pbix"
}

if ([System.IO.Path]::GetExtension($pbix).ToLowerInvariant() -ne '.pbix') {
    throw "Input is not a .pbix file: $pbix"
}

$desktopExecutable = Get-PowerBIDesktopExecutable
$quotedPbix = '"' + $pbix.Replace('"', '""') + '"'
$desktopProcess = Start-Process -FilePath $desktopExecutable -ArgumentList $quotedPbix -PassThru

$result = [ordered]@{
    opened = $true
    processId = if ($desktopProcess) { $desktopProcess.Id } else { $null }
}

$result | ConvertTo-Json -Depth 5 -Compress
