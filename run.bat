@echo off
setlocal enabledelayedexpansion
title srvio

set "FNM_NODE=%USERPROFILE%\AppData\Roaming\fnm\node-versions\v22.22.3\installation"
set "PATH=%FNM_NODE%;%PATH%"

:start

echo Seeding database if needed...
node seed.js

echo Starting srvio (API + Frontend)...
node dev.mjs

echo.
echo Press R + Enter to restart, any other key + Enter to stop
set /p choice=^>

if /i "!choice!"=="R" (
    echo Restarting...
    goto :start
)

echo Stopped.
exit /b
