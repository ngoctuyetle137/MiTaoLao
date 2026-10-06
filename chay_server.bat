@echo off
title UniPass UTC2 - May Chu Trinh Bay Online & LAN
color 0B
echo ==================================================================
echo   Khoi Dong UniPass UTC2 Web Server (Cong 8080)...
echo ==================================================================
powershell -NoProfile -ExecutionPolicy Bypass -Command "& (Join-Path (Get-Location).Path 'server.ps1')"
pause

