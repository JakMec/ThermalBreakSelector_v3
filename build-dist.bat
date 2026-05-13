@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo  ThermalBreakSelector  ^|  self-contained win-x64 build
echo ============================================================
echo.

dotnet publish "ThermalBreakSelector\ThermalBreakSelector.csproj" ^
    -p:PublishProfile=SelfContained-win-x64 ^
    --nologo

if %ERRORLEVEL% neq 0 (
    echo.
    echo  BUILD FAILED — see errors above.
    pause
    exit /b 1
)

echo.
echo  Copying database CSV...
copy /Y "BackgroundData\2026_05_11 ConnectorDatabase.csv" "dist\2026_05_11 ConnectorDatabase.csv" >nul

echo  Copying launchers...
copy /Y "Launch.bat"  "dist\Launch.bat"  >nul
copy /Y "Launch.hta"  "dist\Launch.hta"  >nul

echo.
echo ============================================================
echo  Done!
echo.
echo  Output folder:  %~dp0dist\
echo.
echo  Contents:
dir /b "%~dp0dist"
echo.
echo  Double-click dist\Launch.bat  or  dist\Launch.hta  to run.
echo ============================================================
pause
