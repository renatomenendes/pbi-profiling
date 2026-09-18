# Conceptual design reference:
# HorizunGroup/horizun-pbi-mcp, Apache-2.0.
# Evaluated conversion architecture: PBIX report extraction + Power BI Desktop
# local Analysis Services + official TOM TmdlSerializer.
#
# This implementation is original PowerShell/Node integration for the
# zero-install pbi-profiling runtime. It does not require Python, pythonnet,
# npm packages, elevation, or ExecutionPolicy changes.

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

function Write-ProgressEvent {
    param(
        [Parameter(Mandatory = $true)][string]$Phase,
        [Parameter(Mandatory = $true)][string]$Message
    )

    [Console]::Error.WriteLine("PBI_PROGRESS|$Phase|$Message")
}

function Write-Utf8Text {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Text
    )

    $parent = [System.IO.Path]::GetDirectoryName($Path)
    if ($parent) {
        [System.IO.Directory]::CreateDirectory($parent) | Out-Null
    }

    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Text, $encoding)
}

function Write-JsonFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)]$Value
    )

    $json = $Value | ConvertTo-Json -Depth 20
    Write-Utf8Text -Path $Path -Text $json
}

function Get-PowerBIDesktopExecutable {
    $candidates = New-Object System.Collections.Generic.List[string]

    if ($env:ProgramFiles) {
        $candidates.Add(
            (Join-Path $env:ProgramFiles 'Microsoft Power BI Desktop\bin\PBIDesktop.exe')
        )
    }

    $programFilesX86 = [Environment]::GetEnvironmentVariable('ProgramFiles(x86)')
    if ($programFilesX86) {
        $candidates.Add(
            (Join-Path $programFilesX86 'Microsoft Power BI Desktop\bin\PBIDesktop.exe')
        )
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

    throw @'
Power BI Desktop executable was not found. PBIX intake requires an existing
Power BI Desktop installation, but does not install or modify it.
'@
}

function Get-TomDirectory {
    param(
        [Parameter(Mandatory = $true)][string]$DesktopExecutable
    )

    $searchRoots = New-Object System.Collections.Generic.List[string]
    $exeDirectory = Split-Path -Parent $DesktopExecutable
    $searchRoots.Add($exeDirectory)

    $parent = Split-Path -Parent $exeDirectory
    if ($parent -and $parent -ne $exeDirectory) {
        $searchRoots.Add($parent)
    }

    foreach ($root in $searchRoots | Select-Object -Unique) {
        if (-not (Test-Path -LiteralPath $root -PathType Container)) {
            continue
        }

        $direct = Join-Path $root 'Microsoft.AnalysisServices.Tabular.dll'
        if (Test-Path -LiteralPath $direct -PathType Leaf) {
            return $root
        }

        $found = Get-ChildItem -Path $root -Filter Microsoft.AnalysisServices.Tabular.dll -File -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1

        if ($found) {
            return $found.DirectoryName
        }
    }

    throw @'
Microsoft.AnalysisServices.Tabular.dll was not found alongside Power BI Desktop.
The installed Desktop build does not expose the TOM assemblies required for
zero-install PBIX model serialization.
'@
}

function Import-TomAssemblies {
    param(
        [Parameter(Mandatory = $true)][string]$TomDirectory
    )

    $required = @(
        'Microsoft.AnalysisServices.Core.dll',
        'Microsoft.AnalysisServices.dll',
        'Microsoft.AnalysisServices.Tabular.Json.dll',
        'Microsoft.AnalysisServices.Tabular.dll'
    )

    foreach ($name in $required) {
        $path = Join-Path $TomDirectory $name
        if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
            throw "Required TOM assembly not found: $path"
        }

        [System.Reflection.Assembly]::LoadFrom($path) | Out-Null
    }

    $serializer = [Type]::GetType(
        'Microsoft.AnalysisServices.Tabular.TmdlSerializer, Microsoft.AnalysisServices.Tabular',
        $false
    )

    if (-not $serializer) {
        throw @'
The installed Power BI Desktop TOM assembly does not expose TmdlSerializer.
Update Power BI Desktop through the corporate software channel before using
PBIX intake.
'@
    }
}

function Read-PortFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path
    )

    try {
        $bytes = [System.IO.File]::ReadAllBytes($Path)
    }
    catch {
        return $null
    }

    foreach ($encoding in @(
        [System.Text.Encoding]::Unicode,
        (New-Object System.Text.UTF8Encoding($true)),
        (New-Object System.Text.UTF8Encoding($false))
    )) {
        try {
            $text = $encoding.GetString($bytes).Replace([char]0, '').Trim()
            if ($text -match '^([0-9]{1,5})$') {
                $port = [int]$Matches[1]
                if ($port -ge 1 -and $port -le 65535) {
                    return $port
                }
            }
        }
        catch {
        }
    }

    return $null
}

function Get-WorkspacePorts {
    $bases = @()

    if ($env:LOCALAPPDATA) {
        $bases += Join-Path $env:LOCALAPPDATA 'Microsoft\Power BI Desktop\AnalysisServicesWorkspaces'
        $bases += Join-Path $env:LOCALAPPDATA 'Microsoft\Power BI Desktop Store App\AnalysisServicesWorkspaces'
    }

    $result = @()

    foreach ($base in $bases) {
        if (-not (Test-Path -LiteralPath $base -PathType Container)) {
            continue
        }

        foreach ($workspace in Get-ChildItem -LiteralPath $base -Directory -ErrorAction SilentlyContinue) {
            $portFile = Join-Path $workspace.FullName 'Data\msmdsrv.port.txt'
            if (-not (Test-Path -LiteralPath $portFile -PathType Leaf)) {
                continue
            }

            $port = Read-PortFile -Path $portFile
            if (-not $port) {
                continue
            }

            $item = Get-Item -LiteralPath $portFile -ErrorAction SilentlyContinue
            $result += [PSCustomObject]@{
                Workspace = $workspace.FullName
                Port = $port
                LastWriteTimeUtc = if ($item) { $item.LastWriteTimeUtc } else { [DateTime]::MinValue }
            }
        }
    }

    return @($result)
}

function Get-LiveModelInfo {
    param(
        [Parameter(Mandatory = $true)][int]$Port
    )

    $server = New-Object Microsoft.AnalysisServices.Tabular.Server

    try {
        $server.Connect("Data Source=localhost:$Port")

        if (-not $server.Connected -or $server.Databases.Count -lt 1) {
            return $null
        }

        $database = $server.Databases[0]
        if (-not $database -or -not $database.Model) {
            return $null
        }

        $measureSum = ($database.Model.Tables | ForEach-Object {
            $_.Measures.Count
        } | Measure-Object -Sum).Sum

        if ($null -eq $measureSum) {
            $measureSum = 0
        }

        return [PSCustomObject]@{
            DatabaseName = [string]$database.Name
            TableCount = [int]$database.Model.Tables.Count
            MeasureCount = [int]$measureSum
        }
    }
    catch {
        return $null
    }
    finally {
        try {
            if ($server.Connected) {
                $server.Disconnect()
            }
        }
        catch {
        }

        $server.Dispose()
    }
}

function Wait-NewDesktopModel {
    param(
        [Parameter(Mandatory = $true)]$PreviousPorts,
        [Parameter(Mandatory = $true)][int]$TimeoutMs
    )

    $deadline = [DateTime]::UtcNow.AddMilliseconds($TimeoutMs)
    $lastCounts = @{}

    while ([DateTime]::UtcNow -lt $deadline) {
        $current = @(
            Get-WorkspacePorts |
            Where-Object {
                -not $PreviousPorts.ContainsKey([string]$_.Port)
            } |
            Sort-Object LastWriteTimeUtc -Descending
        )

        foreach ($candidate in $current) {
            $info = Get-LiveModelInfo -Port $candidate.Port
            if (-not $info) {
                continue
            }

            $key = [string]$candidate.Port
            $previousCount = $lastCounts[$key]
            $lastCounts[$key] = $info.TableCount

            if (
                $info.TableCount -gt 0 -and
                $null -ne $previousCount -and
                [int]$previousCount -eq $info.TableCount
            ) {
                return [PSCustomObject]@{
                    Workspace = $candidate.Workspace
                    Port = $candidate.Port
                    DatabaseName = $info.DatabaseName
                    TableCount = $info.TableCount
                    MeasureCount = $info.MeasureCount
                }
            }
        }

        Start-Sleep -Milliseconds 1500
    }

    throw @'
Power BI Desktop was launched, but no new stable local semantic model became
available before the timeout. Do not save the file manually as PBIP: this
adapter never requires Save As. The PBIX may still be loading, waiting for user
interaction, blocked by credentials, or already open in another Desktop session.
If this PBIX was already open before profiling, close that window and retry so
the adapter can correlate a newly created Analysis Services port safely.
'@
}

function Copy-ZipEntry {
    param(
        [Parameter(Mandatory = $true)]$Entry,
        [Parameter(Mandatory = $true)][string]$Destination
    )

    $parent = Split-Path -Parent $Destination
    if ($parent) {
        [System.IO.Directory]::CreateDirectory($parent) | Out-Null
    }

    $input = $Entry.Open()
    try {
        $output = [System.IO.File]::Create($Destination)
        try {
            $input.CopyTo($output)
        }
        finally {
            $output.Dispose()
        }
    }
    finally {
        $input.Dispose()
    }
}

function Export-EmbeddedPbir {
    param(
        [Parameter(Mandatory = $true)][string]$Pbix,
        [Parameter(Mandatory = $true)][string]$ReportDirectory
    )

    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem

    $archive = [System.IO.Compression.ZipFile]::OpenRead($Pbix)

    try {
        $definitionEntries = @(
            $archive.Entries |
            Where-Object {
                $_.FullName.StartsWith(
                    'Report/definition/',
                    [System.StringComparison]::OrdinalIgnoreCase
                ) -and
                -not $_.FullName.EndsWith('/')
            }
        )

        $hasDataModel = @(
            $archive.Entries |
            Where-Object {
                $_.FullName -eq 'DataModel'
            }
        ).Count -gt 0

        if ($definitionEntries.Count -eq 0) {
            $legacyLayout = @(
                $archive.Entries |
                Where-Object {
                    $_.FullName -eq 'Report/Layout'
                }
            ).Count -gt 0

            if ($legacyLayout) {
                throw @'
This PBIX contains the legacy Report/Layout format instead of embedded PBIR.
The zero-install intake currently refuses to approximate that conversion.
Open and save the PBIX once with a current Power BI Desktop build, then retry.
'@
            }

            throw @'
No embedded PBIR report definition was found in the PBIX.
The file may be damaged, protected, or produced by an unsupported Desktop build.
'@
        }

        $definitionRoot = Join-Path $ReportDirectory 'definition'
        [System.IO.Directory]::CreateDirectory($definitionRoot) | Out-Null

        foreach ($entry in $definitionEntries) {
            $relative = $entry.FullName.Substring('Report/definition/'.Length)
            $destination = Join-Path $definitionRoot ($relative.Replace('/', '\'))
            Copy-ZipEntry -Entry $entry -Destination $destination
        }

        foreach ($prefix in @(
            'Report/StaticResources/',
            'Report/CustomVisuals/'
        )) {
            foreach ($entry in $archive.Entries) {
                if (
                    -not $entry.FullName.StartsWith(
                        $prefix,
                        [System.StringComparison]::OrdinalIgnoreCase
                    ) -or
                    $entry.FullName.EndsWith('/')
                ) {
                    continue
                }

                $relative = $entry.FullName.Substring('Report/'.Length)
                $destination = Join-Path $ReportDirectory ($relative.Replace('/', '\'))
                Copy-ZipEntry -Entry $entry -Destination $destination
            }
        }

        $pageCount = @(
            $definitionEntries |
            Where-Object {
                $_.FullName.EndsWith('/page.json')
            }
        ).Count

        $visualCount = @(
            $definitionEntries |
            Where-Object {
                $_.FullName.EndsWith('/visual.json')
            }
        ).Count

        return [PSCustomObject]@{
            ReportFormat = 'embedded-pbir'
            HasDataModel = $hasDataModel
            PageCount = $pageCount
            VisualCount = $visualCount
        }
    }
    finally {
        $archive.Dispose()
    }
}

function Export-Tmdl {
    param(
        [Parameter(Mandatory = $true)][int]$Port,
        [Parameter(Mandatory = $true)][string]$Destination,
        [Parameter(Mandatory = $true)][string]$ProjectName
    )

    $server = New-Object Microsoft.AnalysisServices.Tabular.Server
    $temporary = Join-Path $env:TEMP (
        'pbi-prof-tmdl-' + [Guid]::NewGuid().ToString('N')
    )

    try {
        $server.Connect("Data Source=localhost:$Port")

        if (-not $server.Connected -or $server.Databases.Count -lt 1) {
            throw "No semantic-model database is available on localhost:$Port."
        }

        $database = $server.Databases[0]
        [System.IO.Directory]::CreateDirectory($temporary) | Out-Null

        [Microsoft.AnalysisServices.Tabular.TmdlSerializer]::SerializeDatabaseToFolder(
            $database,
            $temporary
        )

        $files = @(Get-ChildItem -LiteralPath $temporary -File -Recurse)

        if ($files.Count -eq 0) {
            throw 'TmdlSerializer completed without writing any TMDL files.'
        }

        if ($database.Model.Tables.Count -lt 1) {
            throw 'The live semantic model contains no tables.'
        }

        [System.IO.Directory]::CreateDirectory($Destination) | Out-Null

        foreach ($file in $files) {
            $relative = $file.FullName.Substring($temporary.Length).TrimStart('\')
            $target = Join-Path $Destination $relative
            $parent = Split-Path -Parent $target
            [System.IO.Directory]::CreateDirectory($parent) | Out-Null
            [System.IO.File]::Copy($file.FullName, $target, $true)
        }

        $databaseTmdl = Join-Path $Destination 'database.tmdl'
        if (Test-Path -LiteralPath $databaseTmdl -PathType Leaf) {
            $lines = [System.IO.File]::ReadAllLines($databaseTmdl)
            for ($index = 0; $index -lt $lines.Length; $index++) {
                if ($lines[$index].TrimStart().StartsWith('database ')) {
                    $escaped = $ProjectName.Replace("'", "''")
                    $lines[$index] = "database '$escaped'"
                    break
                }
            }

            $encoding = New-Object System.Text.UTF8Encoding($false)
            [System.IO.File]::WriteAllLines($databaseTmdl, $lines, $encoding)
        }

        $measureSum = ($database.Model.Tables | ForEach-Object {
            $_.Measures.Count
        } | Measure-Object -Sum).Sum

        if ($null -eq $measureSum) {
            $measureSum = 0
        }

        return [PSCustomObject]@{
            DatabaseName = [string]$database.Name
            CompatibilityLevel = [int]$database.CompatibilityLevel
            TableCount = [int]$database.Model.Tables.Count
            MeasureCount = [int]$measureSum
            FileCount = $files.Count
        }
    }
    finally {
        try {
            if ($server.Connected) {
                $server.Disconnect()
            }
        }
        catch {
        }

        $server.Dispose()

        if (Test-Path -LiteralPath $temporary) {
            Remove-Item -LiteralPath $temporary -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

$pbixEnvironment = [Environment]::GetEnvironmentVariable('PBI_PROFILING_PBIX')
$destinationEnvironment = [Environment]::GetEnvironmentVariable('PBI_PROFILING_DEST')

if (-not $pbixEnvironment) {
    throw 'PBI_PROFILING_PBIX was not provided.'
}

if (-not $destinationEnvironment) {
    throw 'PBI_PROFILING_DEST was not provided.'
}

$pbix = [System.IO.Path]::GetFullPath($pbixEnvironment)
$destination = [System.IO.Path]::GetFullPath($destinationEnvironment)
$projectName = [string][Environment]::GetEnvironmentVariable('PBI_PROFILING_PROJECT_NAME')
$projectName = $projectName.Trim()
$timeoutText = [Environment]::GetEnvironmentVariable('PBI_PROFILING_TIMEOUT_MS')

if (-not (Test-Path -LiteralPath $pbix -PathType Leaf)) {
    throw "PBIX file does not exist: $pbix"
}

if ([System.IO.Path]::GetExtension($pbix).ToLowerInvariant() -ne '.pbix') {
    throw "Input is not a .pbix file: $pbix"
}

if (-not $projectName) {
    $projectName = [System.IO.Path]::GetFileNameWithoutExtension($pbix)
}

$projectName = $projectName -replace '[<>:"/\\|?*]', '_'
$projectName = $projectName.Trim().TrimEnd('.')

if (-not $projectName) {
    throw 'A valid project name could not be derived from the PBIX file.'
}

$timeoutMs = 300000
if ($timeoutText) {
    $parsedTimeout = 0
    if ([int]::TryParse($timeoutText, [ref]$parsedTimeout) -and $parsedTimeout -gt 0) {
        $timeoutMs = $parsedTimeout
    }
}

[System.IO.Directory]::CreateDirectory($destination) | Out-Null

$reportDirectory = Join-Path $destination "$projectName.Report"
$modelDirectory = Join-Path $destination "$projectName.SemanticModel"
$modelDefinition = Join-Path $modelDirectory 'definition'

Write-ProgressEvent -Phase 'extracting-report' -Message 'Reading embedded PBIR report definition from PBIX.'
$reportInfo = Export-EmbeddedPbir -Pbix $pbix -ReportDirectory $reportDirectory

if (-not $reportInfo.HasDataModel) {
    throw @'
This PBIX is a thin/live-connected report and does not contain a local DataModel.
Automatic remote semantic-model resolution is not implemented yet; the intake
refuses to invent or guess the linked model.
'@
}

Write-ProgressEvent -Phase 'locating-desktop' -Message 'Locating the existing Power BI Desktop installation and TOM assemblies.'
$desktopExecutable = Get-PowerBIDesktopExecutable
$tomDirectory = Get-TomDirectory -DesktopExecutable $desktopExecutable
Import-TomAssemblies -TomDirectory $tomDirectory

$beforePorts = @{}
foreach ($workspace in Get-WorkspacePorts) {
    $beforePorts[[string]$workspace.Port] = $true
}

Write-ProgressEvent -Phase 'opening-desktop' -Message 'Opening PBIX in Power BI Desktop to materialize the semantic model. No manual Save As is required.'
$quotedPbix = '"' + $pbix.Replace('"', '""') + '"'
$desktopProcess = Start-Process -FilePath $desktopExecutable -ArgumentList $quotedPbix -PassThru

Write-ProgressEvent -Phase 'waiting-model' -Message 'Waiting for a new stable local Analysis Services model.'
$modelSession = Wait-NewDesktopModel -PreviousPorts $beforePorts -TimeoutMs $timeoutMs

Write-ProgressEvent -Phase 'serializing-tmdl' -Message 'Serializing the live semantic model with Microsoft TOM.'
$modelInfo = Export-Tmdl -Port $modelSession.Port -Destination $modelDefinition -ProjectName $projectName

$platformSchema = 'https://developer.microsoft.com/json-schemas/fabric/gitIntegration/platformProperties/2.0.0/schema.json'
$pbipSchema = 'https://developer.microsoft.com/json-schemas/fabric/pbip/pbipProperties/1.0.0/schema.json'
$pbirSchema = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definitionProperties/2.0.0/schema.json'
$pbismSchema = 'https://developer.microsoft.com/json-schemas/fabric/item/semanticModel/definitionProperties/1.0.0/schema.json'

Write-JsonFile -Path (Join-Path $reportDirectory '.platform') -Value @{
    '$schema' = $platformSchema
    metadata = @{
        type = 'Report'
        displayName = $projectName
    }
    config = @{
        version = '2.0'
        logicalId = [Guid]::NewGuid().ToString()
    }
}

Write-JsonFile -Path (Join-Path $reportDirectory 'definition.pbir') -Value @{
    '$schema' = $pbirSchema
    version = '4.0'
    datasetReference = @{
        byPath = @{
            path = "../$projectName.SemanticModel"
        }
    }
}

Write-JsonFile -Path (Join-Path $modelDirectory '.platform') -Value @{
    '$schema' = $platformSchema
    metadata = @{
        type = 'SemanticModel'
        displayName = $projectName
    }
    config = @{
        version = '2.0'
        logicalId = [Guid]::NewGuid().ToString()
    }
}

Write-JsonFile -Path (Join-Path $modelDirectory 'definition.pbism') -Value @{
    '$schema' = $pbismSchema
    version = '4.2'
    settings = @{}
}

Write-JsonFile -Path (Join-Path $destination "$projectName.pbip") -Value @{
    '$schema' = $pbipSchema
    version = '1.0'
    artifacts = @(
        @{
            report = @{
                path = "$projectName.Report"
            }
        }
    )
    settings = @{
        enableAutoRecovery = $true
    }
}

Write-ProgressEvent -Phase 'pbix-converted' -Message 'Temporary PBIP project is ready for profiling.'

$result = [ordered]@{
    projectRoot = $destination
    projectName = $projectName
    reportFormat = $reportInfo.ReportFormat
    modelStatus = 'exported'
    pageCount = $reportInfo.PageCount
    visualCount = $reportInfo.VisualCount
    modelTableCount = $modelInfo.TableCount
    modelMeasureCount = $modelInfo.MeasureCount
    compatibilityLevel = $modelInfo.CompatibilityLevel
    desktopOpened = $true
    desktopProcessId = if ($desktopProcess) { $desktopProcess.Id } else { $null }
    desktopLeftOpen = $true
}

$result | ConvertTo-Json -Depth 10 -Compress
