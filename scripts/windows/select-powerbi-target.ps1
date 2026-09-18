$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8

Add-Type -AssemblyName System.Windows.Forms

[System.Windows.Forms.Application]::EnableVisualStyles()

$kind = [string][Environment]::GetEnvironmentVariable(
    'PBI_PROFILING_PICKER_KIND'
)

if (-not $kind) {
    throw 'PBI_PROFILING_PICKER_KIND was not provided.'
}

$result = [ordered]@{
    cancelled = $true
    path = $null
    kind = $kind
}

switch ($kind.ToLowerInvariant()) {
    'pbix' {
        $dialog = New-Object System.Windows.Forms.OpenFileDialog
        try {
            $dialog.Title = 'Selecionar arquivo PBIX'
            $dialog.Filter = 'Power BI Desktop (*.pbix)|*.pbix'
            $dialog.Multiselect = $false
            $dialog.CheckFileExists = $true
            $dialog.CheckPathExists = $true
            $dialog.RestoreDirectory = $true

            if (
                $dialog.ShowDialog() -eq
                [System.Windows.Forms.DialogResult]::OK
            ) {
                $result.cancelled = $false
                $result.path = $dialog.FileName
            }
        }
        finally {
            $dialog.Dispose()
        }
    }

    'pbip' {
        $dialog = New-Object System.Windows.Forms.OpenFileDialog
        try {
            $dialog.Title = 'Selecionar projeto PBIP'
            $dialog.Filter = 'Power BI Project (*.pbip)|*.pbip'
            $dialog.Multiselect = $false
            $dialog.CheckFileExists = $true
            $dialog.CheckPathExists = $true
            $dialog.RestoreDirectory = $true

            if (
                $dialog.ShowDialog() -eq
                [System.Windows.Forms.DialogResult]::OK
            ) {
                $result.cancelled = $false
                $result.path = $dialog.FileName
            }
        }
        finally {
            $dialog.Dispose()
        }
    }

    'folder' {
        $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
        try {
            $dialog.Description = (
                'Selecionar pasta PBIP, .SemanticModel ou .Report'
            )
            $dialog.ShowNewFolderButton = $false

            if (
                $dialog.ShowDialog() -eq
                [System.Windows.Forms.DialogResult]::OK
            ) {
                $result.cancelled = $false
                $result.path = $dialog.SelectedPath
            }
        }
        finally {
            $dialog.Dispose()
        }
    }

    default {
        throw "Unsupported picker kind: $kind"
    }
}

$result | ConvertTo-Json -Compress
