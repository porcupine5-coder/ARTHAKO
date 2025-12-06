<#
Simple helper to download and extract an OpenJDK (Temurin) zip into
`frontend/src/oracleJdk-25` for local development.

This script attempts to download Temurin 17 (LTS) for Windows x64. If you
prefer a different distribution or version, edit the `$DownloadUrl` variable.
#>

Param()

Set-StrictMode -Version Latest

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$targetRel = 'frontend\src\oracleJdk-25'
$target = Join-Path $projectRoot $targetRel

if (Test-Path $target) {
    Write-Host "Target path already exists: $target`nIf you want to refresh it, please remove the folder first." -ForegroundColor Yellow
    exit 0
}

New-Item -ItemType Directory -Path $target -Force | Out-Null

# Default: Temurin (Adoptium) OpenJDK 17 binary zip for Windows x64 (this URL points to the latest release file name)
$DownloadUrl = 'https://github.com/adoptium/temurin17-binaries/releases/latest/download/OpenJDK17U-jdk_x64_windows_hotspot.zip'

$tmpZip = Join-Path $env:TEMP "temurin_jdk_download.zip"
if (Test-Path $tmpZip) { Remove-Item $tmpZip -Force }

Write-Host "Downloading OpenJDK from: $DownloadUrl"
try {
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $tmpZip -UseBasicParsing -ErrorAction Stop
} catch {
    Write-Host "Automatic download failed: $_" -ForegroundColor Red
    Write-Host "Please download a JDK manually (Adoptium/Oracle) and extract it to: $target" -ForegroundColor Yellow
    exit 1
}

Write-Host "Extracting to: $target"
try {
    Expand-Archive -Path $tmpZip -DestinationPath $target -Force
    Remove-Item $tmpZip -Force
    Write-Host "JDK extracted to $target" -ForegroundColor Green
} catch {
    Write-Host "Extraction failed: $_" -ForegroundColor Red
    Write-Host "You can manually extract the zip into $target" -ForegroundColor Yellow
    exit 1
}

Write-Host "Done. If your tools expect a `oracleJdk-25` layout, you may need to rename the extracted folder contents accordingly." -ForegroundColor Cyan
