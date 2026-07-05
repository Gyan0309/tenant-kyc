@echo off
REM Double-click this to configure Tenant Manager on this PC.
REM It runs the setup script next to it (no install of anything required).
title Tenant Manager Setup
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Configure-TenantManager.ps1"
echo.
echo Press any key to close this window.
pause >nul
