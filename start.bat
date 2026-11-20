@echo off
cd /d "%~dp0"
echo Starting Hiyori Book Server...
start http://localhost:8000
deno run -A backend/server.ts
if %errorlevel% neq 0 (
    echo Server exited with error: %errorlevel%
    pause
)
