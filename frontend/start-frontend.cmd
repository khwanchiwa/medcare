@echo off
setlocal

set "FRONTEND_DIR=%~dp0"

curl.exe --fail --silent --max-time 2 "http://127.0.0.1:3000" >nul 2>nul
if "%ERRORLEVEL%"=="0" (
  echo MedCare Frontend is already running at http://localhost:3000
  exit /b 0
)

pushd "%FRONTEND_DIR%"
echo Starting MedCare Frontend at http://localhost:3000
call npm.cmd run dev
set "EXIT_CODE=%ERRORLEVEL%"
popd
exit /b %EXIT_CODE%
