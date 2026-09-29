# FixMemory AI - Start Hindsight Service
$env:PYTHONIOENCODING = "utf-8"
$env:PYTHONUTF8 = "1"
$env:HINDSIGHT_API_LLM_PROVIDER = "gemini"
$env:HINDSIGHT_API_LLM_MODEL = "gemini-3.5-flash-lite"

$envFile = Join-Path $PSScriptRoot "server\.env"
if (Test-Path $envFile) {
    $raw = Get-Content $envFile -Raw
    if ($raw -match '(?m)^GEMINI_API_KEY=([^\r\n]+)') {
        $env:HINDSIGHT_API_LLM_API_KEY = $matches[1].Trim()
    }
}

if (-not $env:HINDSIGHT_API_LLM_API_KEY) {
    Write-Error "Could not find GEMINI_API_KEY in server/.env"
    exit 1
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " FixMemory AI - Starting Hindsight Memory Engine" -ForegroundColor Cyan
Write-Host " Provider: $env:HINDSIGHT_API_LLM_PROVIDER ($env:HINDSIGHT_API_LLM_MODEL)" -ForegroundColor Green
Write-Host " Port: 8888" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

& "C:\Users\Reddy\AppData\Roaming\Python\Python314\Scripts\hindsight-api.exe" --port 8888 $args
