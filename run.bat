@echo off
setlocal enabledelayedexpansion
title srvio

:start

echo Seeding database if needed...
node seed.js

echo Starting json-server (port 3000)...
start "srvio-api" cmd /c "title srvio-api & npm run dev:api"

timeout /t 3 /nobreak >nul

echo Starting Vite dev server...
start "srvio-fe" cmd /c "title srvio-fe & npm run dev"

echo.
echo Both servers started.
echo   Press R + Enter to restart services
echo   Press any other key + Enter to stop

set /p choice=^>

if /i "!choice!"=="R" (
    echo.
    echo Restarting services...
    taskkill /f /fi "WindowTitle eq srvio-api" >nul 2>&1
    taskkill /f /fi "WindowTitle eq srvio-fe" >nul 2>&1
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 " ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
    echo.
    goto :start
)

echo.
echo Stopping services...
taskkill /f /fi "WindowTitle eq srvio-api" >nul 2>&1
taskkill /f /fi "WindowTitle eq srvio-fe" >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 " ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
echo All services stopped.
exit /b