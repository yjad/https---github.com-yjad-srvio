@echo off
title srvio

echo Starting json-server...
cmd /c "seed-db.js" "node seed.js"
start "json-server" cmd /c "json-server --watch "C:\Yahia\Home\Yahia-Dev\Python\SDD\Srvio\db.json" --port 3000"
::start "srvio-api" cmd /c "npm run dev:api"

timeout /t 3 /nobreak >nul

echo Starting Vite dev server...
start "srvio-fe" cmd /c "npm run dev"

echo.
echo Both servers started. Close this window to stop all processes.
pause

::taskkill /f /fi "windowtitle eq json-server" >nul 2>&1
::taskkill /f /fi "windowtitle eq seed-db.js" >nul 2>&1
::taskkill /f /fi "windowtitle eq srvio-fe" >nul 2>&1

wmic process where "commandline like '%%json-server%%'" delete >nul 2>&1
wmic process where "commandline like '%%seed-db.js%%'" delete >nul 2>&1
wmic process where "commandline like '%%srvio-fe%%'" delete >nul 2>&1