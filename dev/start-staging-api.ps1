param(
    [string]$EnvFile = ".env.staging",
    [switch]$StartPostgres
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Import-EnvFile {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        Write-Warning "Env file not found: $Path"
        return
    }

    Get-Content $Path | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#")) {
            return
        }

        $parts = $line -split "=", 2
        if ($parts.Count -ne 2) {
            return
        }

        $name = $parts[0].Trim()
        $value = $parts[1].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

if ($StartPostgres) {
    docker compose -f dev/docker-compose.yml up -d postgres | Out-Host
}

Import-EnvFile -Path $EnvFile

if (-not $env:DATABASE_URL) {
    $env:DATABASE_URL = "postgres://openproof:openproof@localhost:5432/openproof"
}

$env:APP_ENV = "staging"

if (-not $env:BLINK_API_URL) {
    $env:BLINK_API_URL = "https://api.staging.blink.sv/graphql"
}

if (-not $env:LISTEN_ADDR) {
    $env:LISTEN_ADDR = "127.0.0.1:3001"
}

if (-not $env:APP_BASE_URL) {
    $env:APP_BASE_URL = "http://localhost:3000"
}

Write-Host "Starting OpenProof API in staging mode" -ForegroundColor Cyan
Write-Host "APP_ENV=$($env:APP_ENV)"
Write-Host "DATABASE_URL=$($env:DATABASE_URL)"
Write-Host "BLINK_API_URL=$($env:BLINK_API_URL)"

if (-not $env:BLINK_API_KEY) {
    Write-Warning "BLINK_API_KEY is empty. Billing invoice creation will stay unavailable until you provide a staging key."
}

cargo run -p openproof-api-server