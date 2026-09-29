@echo off
setlocal enabledelayedexpansion

:: Fix UTF-8 encoding for Windows CMD so Hindsight banner unicode characters render properly
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
set PYTHONUTF8=1

:: Set Hindsight Gemini provider and model
set HINDSIGHT_API_LLM_PROVIDER=gemini
set HINDSIGHT_API_LLM_MODEL=gemini-3.5-flash-lite

:: Extract GEMINI_API_KEY securely from server\.env without hardcoding
for /f "usebackq tokens=1,* delims==" %%A in ("%~dp0server\.env") do (
    if "%%A"=="GEMINI_API_KEY" set "HINDSIGHT_API_LLM_API_KEY=%%B"
)

if "%HINDSIGHT_API_LLM_API_KEY%"=="" (
    echo [ERROR] Could not find GEMINI_API_KEY in server\.env
    exit /b 1
)

echo ========================================================
echo  FixMemory AI - Starting Hindsight Memory Engine
echo  Provider: %HINDSIGHT_API_LLM_PROVIDER% (%HINDSIGHT_API_LLM_MODEL%)
echo  Port: 8888
echo ========================================================

"C:\Users\Reddy\AppData\Roaming\Python\Python314\Scripts\hindsight-api.exe" --port 8888 %*
