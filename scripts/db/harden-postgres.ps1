#Requires -RunAsAdministrator
# harden-postgres.ps1 -- hardens the LOCAL development PostgreSQL used by CloudGuard.
#
# PHASE 1 (default run):
#   * creates/updates two least-privilege roles:
#       cloudguard_migrator  (DDL, for Flyway)      cloudguard_app  (DML only, for the backend)
#   * moves ownership of objects in schema "public" to cloudguard_migrator
#   * cloudguard_app: INSERT+SELECT only on audit_logs, no access to flyway_schema_history
#   * ALTER SYSTEM SET listen_addresses = 'localhost' and restarts the PostgreSQL service
#   * writes DB_* / FLYWAY_* (and JWT_SECRET if missing) to <project>\.env  (verified to be git-ignored first)
#
# PHASE 2 (-RotateSuperuserPassword): ONLY rotates the superuser password and stores it in
#   %USERPROFILE%\.cloudguard\postgres-superuser.txt. Run it AFTER the backend reads DB_* from .env.
#
#   .\scripts\db\harden-postgres.ps1 -DryRun
#   .\scripts\db\harden-postgres.ps1
#   .\scripts\db\harden-postgres.ps1 -RotateSuperuserPassword

[CmdletBinding()]
param(
    [string]$ProjectRoot = (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)),
    [string]$DbName = 'cloudguard_db',
    [string]$PgHost = 'localhost',
    [int]$Port = 5432,
    [string]$SuperUser = 'postgres',
    [string]$ServiceName = '',
    [switch]$DryRun,
    [switch]$RotateSuperuserPassword
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'
$script:Secrets = @()
$script:Psql = $null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$secretsDir = Join-Path $env:USERPROFILE '.cloudguard'

function Write-Step([string]$m) { Write-Host "==> $m" -ForegroundColor Cyan }
function Write-Ok([string]$m)   { Write-Host "    OK  $m" -ForegroundColor Green }
function Write-Note([string]$m) { Write-Host "    !!  $m" -ForegroundColor Yellow }

function ConvertTo-PlainText([System.Security.SecureString]$s) {
    $b = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)
    try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b) }
}

function New-Secret([int]$Length = 32) {
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $sb = New-Object System.Text.StringBuilder
    $buf = New-Object byte[] 1
    try {
        while ($sb.Length -lt $Length) {
            $rng.GetBytes($buf)
            if ($buf[0] -lt 248) { [void]$sb.Append($chars[$buf[0] % 62]) }
        }
    }
    finally { $rng.Dispose() }
    return $sb.ToString()
}

function Remove-Secrets([string]$text) {
    foreach ($s in $script:Secrets) {
        if ($s -and $s.Length -ge 6) { $text = $text.Replace($s, '***') }
    }
    return $text
}

function Find-Psql {
    $cmd = Get-Command psql.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $cands = @(Get-ChildItem 'C:\Program Files\PostgreSQL\*\bin\psql.exe' -ErrorAction SilentlyContinue |
        Sort-Object { try { [int]$_.Directory.Parent.Name } catch { 0 } } -Descending)
    if ($cands.Count -eq 0) { throw 'psql.exe not found. Add the PostgreSQL bin folder to PATH.' }
    return $cands[0].FullName
}

function Invoke-Psql {
    param(
        [string]$Db,
        [string]$User,
        [string]$Password,
        [string]$Sql,
        [switch]$Scalar,
        [switch]$SingleTx
    )
    $psqlArgs = @('-X', '-q', '-v', 'ON_ERROR_STOP=1', '-h', $PgHost, '-p', "$Port", '-U', $User, '-d', $Db)
    if ($Scalar) { $psqlArgs += @('-t', '-A') }
    if ($SingleTx) { $psqlArgs += '--single-transaction' }
    $psqlArgs += @('-f', '-')
    $old = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $env:PGPASSWORD = $Password
    $code = 0
    $out = @()
    try {
        $out = @($Sql | & $script:Psql @psqlArgs 2>&1 | ForEach-Object { "$_" })
        $code = $LASTEXITCODE
    }
    finally {
        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
        $ErrorActionPreference = $old
    }
    $text = ($out -join "`n").Trim()
    if ($code -ne 0) { throw ('psql failed (exit ' + $code + '): ' + (Remove-Secrets $text)) }
    return $text
}

function Write-TextFile([string]$Path, [string]$Content) {
    [System.IO.File]::WriteAllText($Path, $Content, (New-Object System.Text.UTF8Encoding($false)))
}

function Protect-Path([string]$Path) {
    & icacls.exe $Path /inheritance:r /grant:r ("${env:USERNAME}:(OI)(CI)F") | Out-Null
}

function Set-EnvKey([string[]]$Lines, [string]$Key, [string]$Value) {
    $found = $false
    $res = @()
    foreach ($l in $Lines) {
        if ($l -match ('^\s*' + [regex]::Escape($Key) + '\s*=')) {
            if (-not $found) { $res += "$Key=$Value"; $found = $true }
        }
        else { $res += $l }
    }
    if (-not $found) { $res += "$Key=$Value" }
    return , $res
}

function Get-EnvValue([string[]]$Lines, [string]$Key) {
    foreach ($l in $Lines) {
        if ($l -match ('^\s*' + [regex]::Escape($Key) + '\s*=\s*(.*)$')) { return $Matches[1].Trim() }
    }
    return ''
}

try {
    if ($DbName -notmatch '^[A-Za-z0-9_]+$') { throw 'DbName may contain only letters, digits and underscore.' }
    if ($SuperUser -notmatch '^[A-Za-z0-9_]+$') { throw 'SuperUser may contain only letters, digits and underscore.' }

    Write-Step 'Checking prerequisites'
    if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot 'backend'))) { throw "ProjectRoot looks wrong (no backend folder): $ProjectRoot" }
    $envFile = Join-Path $ProjectRoot '.env'

    $git = Get-Command git.exe -ErrorAction SilentlyContinue
    if ($git) {
        Push-Location $ProjectRoot
        try {
            & git check-ignore -q .env
            $ignored = ($LASTEXITCODE -eq 0)
        }
        finally { Pop-Location }
        if (-not $ignored) { throw '.env is NOT git-ignored. Add ".env" to .gitignore first, then re-run.' }
        Write-Ok '.env is git-ignored'
    }
    else { Write-Note 'git not found: could not verify that .env is git-ignored' }

    $script:Psql = Find-Psql
    Write-Ok "psql: $script:Psql"

    $secure = Read-Host "Current password of PostgreSQL role '$SuperUser'" -AsSecureString
    $curPw = ConvertTo-PlainText $secure
    if ([string]::IsNullOrEmpty($curPw)) { throw 'Empty password.' }
    $script:Secrets += $curPw

    $ver     = Invoke-Psql -Db 'postgres' -User $SuperUser -Password $curPw -Sql 'SHOW server_version;' -Scalar
    $cfgFile = Invoke-Psql -Db 'postgres' -User $SuperUser -Password $curPw -Sql 'SHOW config_file;' -Scalar
    $hbaFile = Invoke-Psql -Db 'postgres' -User $SuperUser -Password $curPw -Sql 'SHOW hba_file;' -Scalar
    $dataDir = Invoke-Psql -Db 'postgres' -User $SuperUser -Password $curPw -Sql 'SHOW data_directory;' -Scalar
    $listen  = Invoke-Psql -Db 'postgres' -User $SuperUser -Password $curPw -Sql 'SHOW listen_addresses;' -Scalar
    Write-Ok "Connected. PostgreSQL $ver, listen_addresses = '$listen'"

    if ($RotateSuperuserPassword) {
        Write-Step "Phase 2: rotate the password of '$SuperUser'"
        $file = Join-Path $secretsDir 'postgres-superuser.txt'
        if ($DryRun) {
            Write-Ok "DryRun: would generate a new password, save it to $file and run ALTER ROLE."
            return
        }
        $newPw = New-Secret 32
        $script:Secrets += $newPw
        New-Item -ItemType Directory -Force -Path $secretsDir | Out-Null
        Protect-Path $secretsDir
        $content = "role=$SuperUser`nhost=$PgHost`nport=$Port`ncreated=$stamp`npassword=$newPw`n"
        Write-TextFile $file $content
        Protect-Path $file
        Invoke-Psql -Db 'postgres' -User $SuperUser -Password $curPw -Sql ('ALTER ROLE "' + $SuperUser + '" PASSWORD ''' + $newPw + ''';') | Out-Null
        Invoke-Psql -Db 'postgres' -User $SuperUser -Password $newPw -Sql 'SELECT 1;' -Scalar | Out-Null
        Write-Ok "Password rotated and verified. Saved to: $file"
        Write-Note 'pgAdmin / any tool that stored the old password must be updated.'
        return
    }

    $dbExists = Invoke-Psql -Db 'postgres' -User $SuperUser -Password $curPw -Sql "SELECT 1 FROM pg_database WHERE datname = '$DbName';" -Scalar
    if ($dbExists -ne '1') { throw "Database '$DbName' does not exist." }

    if ($ServiceName) { $svc = Get-Service -Name $ServiceName }
    else {
        $found = @(Get-Service | Where-Object { $_.Name -like 'postgresql*' })
        if ($found.Count -ne 1) {
            throw ('Could not pick the PostgreSQL service automatically. Found: ' + (($found | ForEach-Object { $_.Name }) -join ', ') + '. Re-run with -ServiceName <name>.')
        }
        $svc = $found[0]
    }
    Write-Ok "Service: $($svc.Name)"

    Write-Step 'Reading pg_hba.conf (read-only check)'
    $hba = @(Get-Content -LiteralPath $hbaFile | Where-Object { $_ -notmatch '^\s*#' -and $_.Trim() -ne '' })
    foreach ($l in $hba) {
        $t = @($l.Trim() -split '\s+')
        if ($l -match '\btrust\b') { Write-Note "pg_hba.conf has a 'trust' rule: $l" }
        if ($t[0] -like 'host*' -and $t.Count -ge 4) {
            $addr = $t[3]
            if ($addr -notmatch '^(127\.0\.0\.1|::1|localhost)(/\d+)?$' -and $addr -ne 'samehost') {
                Write-Note "pg_hba.conf allows a non-local address: $l"
            }
        }
    }

    Write-Step 'Plan'
    Write-Host "    1. backup config files to $secretsDir\backups\$stamp"
    Write-Host "    2. create/update roles cloudguard_migrator and cloudguard_app (new random passwords)"
    Write-Host "    3. transfer ownership of objects in public to cloudguard_migrator; grant DML to cloudguard_app;"
    Write-Host "       audit_logs: app gets SELECT+INSERT only"
    Write-Host "    4. ALTER SYSTEM SET listen_addresses = 'localhost' (+ service restart if needed)"
    Write-Host "    5. write DB_* / FLYWAY_* to $envFile"
    if ($DryRun) {
        Write-Ok 'DryRun finished: nothing was changed.'
        return
    }

    $migPw = New-Secret 32
    $appPw = New-Secret 32
    $jwt   = New-Secret 64
    $script:Secrets += @($migPw, $appPw, $jwt)

    Write-Step 'Backups'
    $bk = Join-Path $secretsDir "backups\$stamp"
    New-Item -ItemType Directory -Force -Path $bk | Out-Null
    Protect-Path $secretsDir
    foreach ($f in @($cfgFile, $hbaFile, (Join-Path $dataDir 'postgresql.auto.conf'))) {
        if (Test-Path -LiteralPath $f) { Copy-Item -LiteralPath $f -Destination $bk -Force }
    }
    if (Test-Path -LiteralPath $envFile) { Copy-Item -LiteralPath $envFile -Destination (Join-Path $bk '.env.before') -Force }
    Write-Ok "Backups in $bk"

    Write-Step 'Creating roles, ownership and grants (single transaction: all or nothing)'
    $sql = @'
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cloudguard_migrator') THEN
    CREATE ROLE cloudguard_migrator LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD '<<MIG>>';
  ELSE
    ALTER ROLE cloudguard_migrator LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD '<<MIG>>';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cloudguard_app') THEN
    CREATE ROLE cloudguard_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD '<<APP>>';
  ELSE
    ALTER ROLE cloudguard_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD '<<APP>>';
  END IF;
END
$do$;

REVOKE ALL ON DATABASE "<<DB>>" FROM PUBLIC;
GRANT CONNECT ON DATABASE "<<DB>>" TO cloudguard_migrator, cloudguard_app;

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO cloudguard_migrator;
GRANT USAGE ON SCHEMA public TO cloudguard_app;

DO $do$
DECLARE r record;
BEGIN
  FOR r IN SELECT format('%I.%I', schemaname, tablename) AS n FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE %s OWNER TO cloudguard_migrator', r.n);
  END LOOP;
  FOR r IN
    SELECT format('%I.%I', n.nspname, c.relname) AS n
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'S'
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.classid = 'pg_class'::regclass AND d.objid = c.oid AND d.deptype IN ('a', 'i'))
  LOOP
    EXECUTE format('ALTER SEQUENCE %s OWNER TO cloudguard_migrator', r.n);
  END LOOP;
  FOR r IN SELECT format('%I.%I', schemaname, viewname) AS n FROM pg_views WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER VIEW %s OWNER TO cloudguard_migrator', r.n);
  END LOOP;
  FOR r IN
    SELECT format('%I.%I', n.nspname, t.typname) AS n
    FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype IN ('e', 'd')
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = t.oid AND d.deptype = 'e')
  LOOP
    EXECUTE format('ALTER TYPE %s OWNER TO cloudguard_migrator', r.n);
  END LOOP;
  FOR r IN
    SELECT p.oid::regprocedure::text AS n
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
  LOOP
    EXECUTE format('ALTER FUNCTION %s OWNER TO cloudguard_migrator', r.n);
  END LOOP;
END
$do$;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cloudguard_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cloudguard_app;

DO $do$
BEGIN
  IF to_regclass('public.audit_logs') IS NULL THEN
    RAISE EXCEPTION 'public.audit_logs does not exist';
  END IF;
  REVOKE ALL ON TABLE public.audit_logs FROM cloudguard_app;
  GRANT SELECT, INSERT ON TABLE public.audit_logs TO cloudguard_app;
  IF to_regclass('public.flyway_schema_history') IS NOT NULL THEN
    REVOKE ALL ON TABLE public.flyway_schema_history FROM cloudguard_app;
  END IF;
END
$do$;

ALTER DEFAULT PRIVILEGES FOR ROLE cloudguard_migrator IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cloudguard_app;
ALTER DEFAULT PRIVILEGES FOR ROLE cloudguard_migrator IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO cloudguard_app;
'@
    $sql = $sql.Replace('<<MIG>>', $migPw).Replace('<<APP>>', $appPw).Replace('<<DB>>', $DbName)
    Invoke-Psql -Db $DbName -User $SuperUser -Password $curPw -Sql $sql -SingleTx | Out-Null
    Write-Ok 'Roles, ownership and grants applied'

    Write-Step 'Verifying privileges'
    $priv = Invoke-Psql -Db $DbName -User $SuperUser -Password $curPw -Scalar -Sql @'
SELECT has_table_privilege('cloudguard_app','public.audit_logs','SELECT')::text || ',' ||
       has_table_privilege('cloudguard_app','public.audit_logs','INSERT')::text || ',' ||
       has_table_privilege('cloudguard_app','public.audit_logs','UPDATE')::text || ',' ||
       has_table_privilege('cloudguard_app','public.audit_logs','DELETE')::text || ',' ||
       has_table_privilege('cloudguard_app','public.audit_logs','TRUNCATE')::text;
'@
    if ($priv -ne 'true,true,false,false,false') { throw "Unexpected audit_logs privileges for cloudguard_app (SELECT,INSERT,UPDATE,DELETE,TRUNCATE): $priv" }
    Write-Ok 'cloudguard_app on audit_logs: SELECT+INSERT only'

    $notOwned = Invoke-Psql -Db $DbName -User $SuperUser -Password $curPw -Scalar -Sql "SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND tableowner <> 'cloudguard_migrator';"
    if ($notOwned -ne '0') { throw "$notOwned table(s) in public are not owned by cloudguard_migrator." }
    Write-Ok 'All tables in public are owned by cloudguard_migrator'

    $isSuper = Invoke-Psql -Db $DbName -User $SuperUser -Password $curPw -Scalar -Sql "SELECT count(*) FROM pg_roles WHERE rolname IN ('cloudguard_app','cloudguard_migrator') AND (rolsuper OR rolcreatedb OR rolcreaterole);"
    if ($isSuper -ne '0') { throw 'A cloudguard role has elevated attributes.' }
    Write-Ok 'Neither role is superuser / createdb / createrole'

    $who = Invoke-Psql -Db $DbName -User 'cloudguard_app' -Password $appPw -Scalar -Sql 'SELECT current_user;'
    if ($who -ne 'cloudguard_app') { throw 'Login as cloudguard_app failed.' }
    $denied = $false
    try { Invoke-Psql -Db $DbName -User 'cloudguard_app' -Password $appPw -Sql 'DELETE FROM public.audit_logs WHERE false;' | Out-Null }
    catch { if ($_.Exception.Message -match 'permission denied') { $denied = $true } else { throw } }
    if (-not $denied) { throw 'cloudguard_app can still DELETE from audit_logs.' }
    Write-Ok 'Login works; DELETE on audit_logs is denied for cloudguard_app'
    $mig = Invoke-Psql -Db $DbName -User 'cloudguard_migrator' -Password $migPw -Scalar -Sql 'SELECT current_user;'
    if ($mig -ne 'cloudguard_migrator') { throw 'Login as cloudguard_migrator failed.' }
    Write-Ok 'Login works for cloudguard_migrator'

    Write-Step 'Writing .env'
    $lines = @()
    if (Test-Path -LiteralPath $envFile) { $lines = @(Get-Content -LiteralPath $envFile) }
    $jdbc = "jdbc:postgresql://${PgHost}:${Port}/${DbName}"
    $lines = Set-EnvKey $lines 'DB_URL' $jdbc
    $lines = Set-EnvKey $lines 'DB_USER' 'cloudguard_app'
    $lines = Set-EnvKey $lines 'DB_PASSWORD' $appPw
    $lines = Set-EnvKey $lines 'FLYWAY_URL' $jdbc
    $lines = Set-EnvKey $lines 'FLYWAY_USER' 'cloudguard_migrator'
    $lines = Set-EnvKey $lines 'FLYWAY_PASSWORD' $migPw
    $curJwt = Get-EnvValue $lines 'JWT_SECRET'
    if ($curJwt.Length -lt 48) { $lines = Set-EnvKey $lines 'JWT_SECRET' $jwt; Write-Ok 'JWT_SECRET generated (64 chars)' }
    else { Write-Ok 'JWT_SECRET already present, kept' }
    Write-TextFile $envFile ((($lines -join "`n")).TrimEnd() + "`n")
    Write-Ok "Written: $envFile"

    Write-Step 'listen_addresses'
    if ($listen -eq 'localhost') { Write-Ok "Already 'localhost'" }
    else {
        Invoke-Psql -Db 'postgres' -User $SuperUser -Password $curPw -Sql "ALTER SYSTEM SET listen_addresses = 'localhost';" | Out-Null
        Write-Ok "ALTER SYSTEM done; restarting service $($svc.Name)"
        Restart-Service -Name $svc.Name -Force
        $up = $false
        for ($i = 0; $i -lt 30; $i++) {
            Start-Sleep -Seconds 2
            try { Invoke-Psql -Db 'postgres' -User $SuperUser -Password $curPw -Sql 'SELECT 1;' -Scalar | Out-Null; $up = $true; break } catch { }
        }
        if (-not $up) { throw "PostgreSQL did not come back after restart. Restore backups from $bk and start the service manually." }
        $now = Invoke-Psql -Db 'postgres' -User $SuperUser -Password $curPw -Scalar -Sql 'SHOW listen_addresses;'
        if ($now -ne 'localhost') { throw "listen_addresses is '$now' after restart." }
        Write-Ok "listen_addresses = '$now'"
    }
    $bound = @(Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | ForEach-Object { $_.LocalAddress } | Sort-Object -Unique)
    Write-Host ("    listening on: " + ($bound -join ', '))
    $extra = @($bound | Where-Object { $_ -notin @('127.0.0.1', '::1') })
    if ($extra.Count -gt 0) { Write-Note "Still listening on non-loopback addresses: $($extra -join ', ')" }

    Write-Host ''
    Write-Host 'DONE (phase 1).' -ForegroundColor Green
    Write-Host "  Secrets (not shown) : $envFile"
    Write-Host "  Backups             : $bk"
    Write-Host '  NEXT STEPS:'
    Write-Host '   1. Make backend application.yml read DB_URL, DB_USER, DB_PASSWORD, FLYWAY_URL, FLYWAY_USER,'
    Write-Host '      FLYWAY_PASSWORD, JWT_SECRET from the environment (no defaults).'
    Write-Host '   2. After the backend works with those variables, run this script with -RotateSuperuserPassword.'
    Write-Host '  UNDO listen_addresses : psql -U postgres -c "ALTER SYSTEM RESET listen_addresses;"  then restart the service.'
}
catch {
    Write-Host ('ERROR: ' + (Remove-Secrets $_.Exception.Message)) -ForegroundColor Red
    exit 1
}
finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}