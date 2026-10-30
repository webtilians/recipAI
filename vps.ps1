<#
.SYNOPSIS
RecipAI's backend on the LAIN server, managed from this PC (same SSH key as LAIN's vps.ps1).

.EXAMPLE
.\vps.ps1 -Install -Branch feat/mvp   # first install, from a branch (default: main)
.\vps.ps1 -Update                     # bring the server up to date
.\vps.ps1 -Update -Branch main        # switch the server to another branch
.\vps.ps1 -Status                     # service, version, AI mode
.\vps.ps1 -Gemini                     # paste a Gemini key (masked) and turn the AI on
.\vps.ps1 -GeminiFromLain             # reuse LAIN's Gemini key; it never leaves the server
.\vps.ps1 -Demo                       # back to demo recipes
.\vps.ps1 -AppEnv                     # write mobile\.env with the server address and app token
#>
param(
    [switch]$Install,
    [switch]$Update,
    [switch]$Status,
    [switch]$Gemini,
    [switch]$GeminiFromLain,
    [switch]$Demo,
    [switch]$AppEnv,
    [string]$Branch,
    [string]$Ip
)
$ErrorActionPreference = 'Stop'
$sshKey = Join-Path $env:USERPROFILE '.ssh\lain_vps'
$configDir = Join-Path $env:LOCALAPPDATA 'RecipAI'
$configFile = Join-Path $configDir 'server.json'
$lainConfig = Join-Path $env:LOCALAPPDATA 'LAIN\VPS\server.json'
$repo = 'https://github.com/webtilians/recipAI.git'
$utf8 = New-Object Text.UTF8Encoding $false

function Get-ServerIp {
    if ($Ip) {
        $address = $null
        if (-not [Net.IPAddress]::TryParse($Ip, [ref]$address) -or $address.AddressFamily -ne 'InterNetwork') {
            throw 'Usa la IPv4 del servidor: cuatro números separados por puntos.'
        }
        New-Item -ItemType Directory -Force -Path $configDir | Out-Null
        [IO.File]::WriteAllText($configFile, (@{ ip = $Ip } | ConvertTo-Json), $utf8)
    }
    foreach ($file in $configFile, $lainConfig) {
        if (Test-Path -LiteralPath $file) { return (Get-Content -LiteralPath $file -Raw | ConvertFrom-Json).ip }
    }
    throw 'Indica la IP del servidor la primera vez: .\vps.ps1 -Ip 1.2.3.4 -Install'
}

function Get-SshOptions {
    if (-not (Test-Path -LiteralPath $sshKey)) { throw "Falta la llave SSH $sshKey (la misma que usa LAIN)." }
    return @('-i', $sshKey, '-o', 'IdentitiesOnly=yes', '-o', 'StrictHostKeyChecking=accept-new', '-o', 'ServerAliveInterval=30')
}

function Invoke-Server([string]$command) {
    $options = Get-SshOptions
    & ssh.exe @options "root@$serverIp" $command
    if ($LASTEXITCODE -ne 0) { throw "El servidor devolvió un error ($LASTEXITCODE)." }
}

function Get-BranchArgument {
    if (-not $Branch) { return '' }
    if ($Branch -notmatch '^[A-Za-z0-9._/-]+$') { throw "Nombre de rama no válido: $Branch" }
    return $Branch
}

$serverIp = Get-ServerIp
$branchName = Get-BranchArgument

if ($Install) {
    $target = if ($branchName) { $branchName } else { 'main' }
    # No double quotes: Windows PowerShell does not escape them for ssh.exe. The branch name was checked above.
    Invoke-Server ("set -e; b=$target; test -d /opt/recipai/.git || git clone -q $repo /opt/recipai; " +
        'git -C /opt/recipai fetch -q origin +refs/heads/${b}:refs/remotes/origin/${b}; ' +
        'git -C /opt/recipai checkout -q -B $b origin/$b; ' +
        'git -C /opt/recipai reset -q --hard origin/$b; ' +
        'RECIPAI_BRANCH=$b bash /opt/recipai/deploy/vps/setup.sh')
}

if ($Update) {
    if ($branchName) { Invoke-Server "RECIPAI_BRANCH='$branchName' recipai-update" }
    else { Invoke-Server 'recipai-update' }
}

if ($Gemini) {
    # Asked here, masked; it travels only inside the SSH connection's input.
    $secure = Read-Host 'Pega tu clave de Gemini (clic derecho o Ctrl+V) y pulsa Enter' -AsSecureString
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
    $options = Get-SshOptions
    # Plain ASCII: a UTF-8 output encoding would prefix a byte order mark.
    $OutputEncoding = New-Object Text.ASCIIEncoding
    $plain | & ssh.exe @options "root@$serverIp" 'recipai-set-key'
    $plain = $null
    if ($LASTEXITCODE -ne 0) { throw 'No se activó Gemini (mira el mensaje de arriba).' }
}

if ($GeminiFromLain) { Invoke-Server 'recipai-set-key --from-lain' }
if ($Demo) { Invoke-Server 'recipai-set-key --demo' }

if ($AppEnv) {
    $options = Get-SshOptions
    $serverHost = (& ssh.exe @options "root@$serverIp" 'cat /etc/recipai/host').Trim()
    $token = (& ssh.exe @options "root@$serverIp" 'recipai-token').Trim()
    if ($LASTEXITCODE -ne 0 -or -not $serverHost -or -not $token) { throw 'No se pudo leer la dirección o el token del servidor.' }
    $envFile = Join-Path $PSScriptRoot 'mobile\.env'
    $content = "# Written by vps.ps1 -AppEnv`nEXPO_PUBLIC_API_URL=https://$serverHost`nEXPO_PUBLIC_RECIPAI_TOKEN=$token`n"
    [IO.File]::WriteAllText($envFile, $content, $utf8)
    $token = $null
    Write-Host "mobile\.env apunta a https://$serverHost (token incluido). Reinicia 'npx expo start' para que la app lo use."
}

if ($Status) { Invoke-Server 'recipai-status' }

if (-not ($Install -or $Update -or $Status -or $Gemini -or $GeminiFromLain -or $Demo -or $AppEnv)) {
    Get-Help $PSCommandPath -Examples
}
