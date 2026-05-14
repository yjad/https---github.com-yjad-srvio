@echo off

:loop

cls
echo Starting Frontend development server...
echo.
echo Press Ctrl+C twice to stop.
echo.

call npm run dev

echo.
echo Frontend process exited. Restarting in 3 seconds...
echo.

timeout /t 3 >nul
goto loop