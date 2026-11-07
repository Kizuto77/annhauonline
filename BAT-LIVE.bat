@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Nhau Dem 134 - Quan nhau online
where node >nul 2>nul || (
  echo Chua cai Node.js. Tai ban LTS o https://nodejs.org roi chay lai file nay.
  pause
  exit /b 1
)
rem Cai (hoac sua) thu vien khi chua co hoac cai do dang
if not exist "node_modules\tiktok-live-connector\package.json" goto install
if not exist "node_modules\msedge-tts\package.json" goto install
goto run
:install
echo Dang cai thu vien, doi 1-2 phut...
call npm install --no-audit --no-fund
if not exist "node_modules\tiktok-live-connector\package.json" (
  echo Cai thu vien bi loi. Chup man hinh cua so nay gui nguoi ho tro.
  pause
  exit /b 1
)
:run
echo.
echo Dang mo quan Nhau Dem 134... Dong cua so nay la tat app.
echo Link cho TikTok LIVE Studio: http://lvh.me:3000/?view=stage
echo.
start "" cmd /c "timeout /t 3 >nul & start http://localhost:3000"
node server.js
pause
