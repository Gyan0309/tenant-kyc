# ============================================================================
#  Tenant Manager — one-time connection setup
#
#  VENDOR (you): paste the client's two Azure connection strings between the
#  single quotes below, save this file, then send BOTH files in this folder to
#  the client:
#      • Configure Tenant Manager.cmd   <- the client double-clicks this
#      • Configure-TenantManager.ps1    <- this file (keep next to the .cmd)
#
#  CLIENT: just double-click "Configure Tenant Manager.cmd". Nothing else.
# ============================================================================

$TableConnectionString = 'PASTE_AZURE_TABLE_CONNECTION_STRING_HERE'
$BlobConnectionString  = 'PASTE_AZURE_STORAGE_CONNECTION_STRING_HERE'

# ---- (advanced, optional) container names — leave as-is unless you renamed them
$DocsContainer   = 'tenant-documents'
$AssetsContainer = 'property-assets'

# ----------------------------------------------------------------------------
# You should not need to edit anything below this line.
# ----------------------------------------------------------------------------
$ErrorActionPreference = 'Stop'

function Fail($msg) {
  Write-Host ""
  Write-Host "  X  $msg" -ForegroundColor Red
  Write-Host ""
  exit 1
}

Write-Host ""
Write-Host "  Configuring Tenant Manager..." -ForegroundColor Cyan

if ($TableConnectionString -like 'PASTE_*' -or $BlobConnectionString -like 'PASTE_*') {
  Fail "This file hasn't been set up yet. The connection strings are still placeholders. (Vendor: edit Configure-TenantManager.ps1 first.)"
}
if ($TableConnectionString -notmatch 'AccountName=|TableEndpoint=') {
  Fail "The Table connection string doesn't look valid."
}
if ($BlobConnectionString -notmatch 'AccountName=|BlobEndpoint=') {
  Fail "The Storage (blob) connection string doesn't look valid."
}

# Config lives in the per-user app-data folder that the app reads on startup.
$dir     = Join-Path $env:APPDATA 'Tenant Manager'
$cfgPath = Join-Path $dir 'config.json'
New-Item -ItemType Directory -Force -Path $dir | Out-Null

# Preserve an existing AUTH_SECRET (so signed-in sessions survive re-runs),
# otherwise generate a strong random one.
$authSecret = $null
if (Test-Path $cfgPath) {
  try { $authSecret = (Get-Content $cfgPath -Raw | ConvertFrom-Json).AUTH_SECRET } catch { }
}
if ([string]::IsNullOrWhiteSpace($authSecret)) {
  $bytes = New-Object 'System.Byte[]' 32
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $authSecret = [Convert]::ToBase64String($bytes)
}

$config = [ordered]@{
  AZURE_TABLE_CONNECTION_STRING   = $TableConnectionString
  AZURE_STORAGE_CONNECTION_STRING = $BlobConnectionString
  AZURE_BLOB_CONTAINER_DOCS       = $DocsContainer
  AZURE_BLOB_CONTAINER_ASSETS     = $AssetsContainer
  AUTH_SECRET                     = $authSecret
}
$config | ConvertTo-Json | Set-Content -Path $cfgPath -Encoding UTF8

Write-Host "  OK  Configuration saved." -ForegroundColor Green
Write-Host "      $cfgPath"

# Try to launch the installed app so the client is ready to go.
$candidates = @(
  (Join-Path $env:LOCALAPPDATA 'Programs\tenant-manager\Tenant Manager.exe'),
  (Join-Path ${env:ProgramFiles} 'Tenant Manager\Tenant Manager.exe')
)
$exe = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($exe) {
  Write-Host "  ->  Starting Tenant Manager..." -ForegroundColor Cyan
  Start-Process -FilePath $exe
} else {
  Write-Host ""
  Write-Host "  You can now open Tenant Manager from the Start menu." -ForegroundColor Yellow
}
Write-Host ""
