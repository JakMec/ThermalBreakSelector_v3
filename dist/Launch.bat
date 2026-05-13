@echo off
cd /d "%~dp0"

echo Starting ThermalBreakSelector...

if not exist "ThermalBreakSelector.exe" (
    echo ERROR: ThermalBreakSelector.exe not found in this folder.
    echo Make sure you are running Launch.bat from the dist\ folder.
    pause
    exit /b 1
)

start "ThermalBreakSelector" ThermalBreakSelector.exe
echo Server starting on http://localhost:5100
timeout /t 3 /nobreak >nul
start "" "http://localhost:5100/ThermalBreakSelector.html"
