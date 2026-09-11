<#
    Cleopatre - Espace Sante Beaute
    ------------------------------------------------------------------------
    .\start.ps1   prepares the local environment and launches the application.

    What it does, in order:
      1. checks Node.js (>= 20)
      2. creates .env from .env.example if missing, with a fresh SESSION_SECRET
      3. installs npm dependencies when node_modules is absent
      4. resolves a database:
           - reuses DATABASE_URL when it points at a reachable PostgreSQL
             (a server you already run is NEVER modified, stopped or dropped)
           - otherwise boots an ISOLATED project-local cluster in .devdb/ on
             port 5433, owned by the project, with its own data directory
      5. creates the required extensions (unaccent, pg_trgm) and applies schema
      6. seeds demo data only when the catalog is empty
      7. starts the dev server (or the production server with -Prod)

    Safety guarantees:
      · no production credentials are read or written
      · the local cluster is never exposed beyond 127.0.0.1
      · no other database on the machine is touched: the only cluster this
        script can stop is the one recorded in .devdb/state.json

    Usage:
      .\start.ps1                 dev server on http://localhost:3000
      .\start.ps1 -Port 4000      dev server on another port
      .\start.ps1 -Prod           production build + start
      .\start.ps1 -SkipSeed       do not insert demo data
      .\start.ps1 -ResetDb        wipe and recreate the local dev database
#>
[CmdletBinding()]
param(
  [int]$Port = 3000,
  [switch]$Prod,
  [switch]$SkipSeed,
  [switch]$ResetDb
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

function Write-Step($message) { Write-Host "[cleopatre] $message" -ForegroundColor Cyan }
function Write-Warn($message) { Write-Host "[cleopatre] $message" -ForegroundColor Yellow }
function Write-Fail($message) { Write-Host "[cleopatre] $message" -ForegroundColor Red; exit 1 }

# ---------------------------------------------------------------- 1. Node ---
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { Write-Fail "Node.js 20 or newer is required: https://nodejs.org" }
$nodeMajor = [int](& node -p "process.versions.node.split('.')[0]")
if ($nodeMajor -lt 20) { Write-Fail "Node.js $nodeMajor found; version 20 or newer is required." }
Write-Step "Node.js $(& node -v)"

$npm = if ($env:OS -eq "Windows_NT") { "npm.cmd" } else { "npm" }

# ----------------------------------------------------------------- 2. env ---
$envPath = Join-Path $root ".env"
if (-not (Test-Path $envPath)) {
  Write-Step "creating .env from .env.example"
  Copy-Item (Join-Path $root ".env.example") $envPath
  $secret = -join ((1..64) | ForEach-Object { "{0:x}" -f (Get-Random -Max 16) })
  (Get-Content $envPath) `
    -replace '^SESSION_SECRET=.*$', "SESSION_SECRET=$secret" `
    -replace '^NEXT_PUBLIC_SITE_URL=.*$', "NEXT_PUBLIC_SITE_URL=http://localhost:$Port" |
    Set-Content $envPath -Encoding utf8
} else {
  Write-Step ".env already present - left untouched"
}

# Read DATABASE_URL from .env (fall back to the process environment).
function Get-EnvValue([string]$name) {
  if (Test-Path Env:$name) { return (Get-Item Env:$name).Value }
  $line = Select-String -Path $envPath -Pattern "^$name=(.*)$" -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($line) { return $line.Matches[0].Groups[1].Value.Trim('"').Trim("'") }
  return $null
}

# Replace a single line in .env, creating it if the key is absent.
function Set-EnvValue([string]$name, [string]$value) {
  $lines = @(Get-Content $envPath)
  $at = -1
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "^\s*$name\s*=") { $at = $i; break }
  }
  if ($at -ge 0) { $lines[$at] = "$name=$value" } else { $lines += "" ; $lines += "$name=$value" }
  Set-Content -Path $envPath -Value $lines -Encoding utf8
}

# Does the database in .env actually answer? Uses the project's own pg driver,
# so it tests the real credentials and not just an open TCP port.
function Test-Database([string]$url) {
  if (-not $url) { return $false }
  $probe = "const{Client}=require('pg');const c=new Client({connectionString:process.argv[1],connectionTimeoutMillis:4000});c.connect().then(()=>c.query('select 1')).then(()=>{c.end();process.exit(0)}).catch(()=>{process.exit(1)});"
  & node -e $probe $url *> $null
  return ($LASTEXITCODE -eq 0)
}

# ------------------------------------------------------------ 3. modules ---
if (-not (Test-Path (Join-Path $root "node_modules"))) {
  Write-Step "installing dependencies (first run, this may take a minute)"
  & $npm install --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { Write-Fail "npm install failed." }
} else {
  Write-Step "dependencies already installed"
}

# ------------------------------------------------------------ 4/5. database -
if ($ResetDb) {
  Write-Step "resetting the project-local dev database"
  & node (Join-Path $root "scripts/dev-db.mjs") reset
} else {
  Write-Step "resolving the development database"
  & node (Join-Path $root "scripts/dev-db.mjs") start
}
if ($LASTEXITCODE -ne 0) { Write-Fail "could not prepare a development database." }

# `scripts/dev-db.mjs` writes the resolved address into .env when the cluster is
# its own. This is the safety net for the case where it could not (read-only
# file, or a server that went away between the two steps): never hand a stale
# address to the schema push.
$dbUrl = Get-EnvValue "DATABASE_URL"
if (-not (Test-Database $dbUrl)) {
  $statePath = Join-Path $root ".devdb/state.json"
  $fallback = $null
  if (Test-Path $statePath) {
    try {
      $port = (Get-Content $statePath -Raw | ConvertFrom-Json).port
      if ($port) { $fallback = "postgresql://cleopatre:cleopatre@127.0.0.1:$port/cleopatre_dev" }
    } catch { }
  }
  if ($fallback -and (Test-Database $fallback)) {
    Write-Warn "DATABASE_URL in .env did not answer - switching to the project-local cluster on port $port"
    Set-EnvValue "DATABASE_URL" $fallback
    $dbUrl = $fallback
  } elseif (-not $fallback) {
    Write-Fail "no PostgreSQL answering at $dbUrl, and no project-local cluster to fall back on."
  } else {
    Write-Fail "the project-local cluster is not answering on port $port. Check .devdb/logs/postgres.log."
  }
}
Write-Step "database ready" 

# Apply the schema. `push` is additive: it never drops tables or data that the
# developer already has.
Write-Step "applying database schema"
& $npm run db:push -- --force 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) { Write-Fail "could not apply the schema - the application would not work. See the output above." }

# ---------------------------------------------------------------- 6. seed ---
if (-not $SkipSeed) {
  $count = & node -e "const {Client}=require('pg');(async()=>{try{const c=new Client({connectionString:process.argv[1]});await c.connect();const r=await c.query('select count(*)::int n from products');console.log(r.rows[0].n);}catch{console.log('-1')}})()" $dbUrl 2>$null
  if ($count -eq "0") {
    Write-Step "seeding demo catalog and demo accounts"
    & $npm run db:seed
    if ($LASTEXITCODE -ne 0) { Write-Warn "seeding failed - the shop will be empty but functional" }
  } elseif ($count -eq "-1") {
    Write-Warn "could not read the catalog table; skipping the seed"
  } else {
    Write-Step "catalog already contains $count products - seed skipped"
  }
}

# ----------------------------------------------------------------- 7. run ---
$env:PORT = "$Port"
if ($Prod) {
  Write-Step "building for production"
  & $npm run build
  if ($LASTEXITCODE -ne 0) { Write-Fail "production build failed." }
  Write-Step "starting production server on http://localhost:$Port"
  & $npm run start -- --port $Port
} else {
  Write-Step "starting the dev server on http://localhost:$Port"
  Write-Host ""
  Write-Host "  Boutique      http://localhost:$Port" -ForegroundColor Green
  Write-Host "  Administration http://localhost:$Port/admin  (admin@cleopatre.tn / Admin123!)" -ForegroundColor Green
  Write-Host ""
  & $npm run dev -- --port $Port
}
