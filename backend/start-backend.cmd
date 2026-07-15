@echo off
setlocal

set "BACKEND_DIR=%~dp0"
set "PYTHON=%BACKEND_DIR%.venv\Scripts\python.exe"

if not exist "%PYTHON%" (
  echo Backend virtual environment was not found.
  echo Run: python -m venv backend\.venv
  exit /b 1
)

curl.exe --fail --silent --max-time 2 "http://127.0.0.1:8000/health" >nul 2>nul
if "%ERRORLEVEL%"=="0" (
  echo MedCare Backend is already running at http://127.0.0.1:8000
  exit /b 0
)

pushd "%BACKEND_DIR%"
echo Starting MedCare Backend at http://127.0.0.1:8000
rem Run a single stable development process. Add --reload manually only when needed.
"%PYTHON%" -m uvicorn app.main:app --host 127.0.0.1 --port 8000
set "EXIT_CODE=%ERRORLEVEL%"
popd

if not "%EXIT_CODE%"=="0" (
  echo.
  echo Backend stopped with exit code %EXIT_CODE%.
  echo If port 8000 is already in use, open http://127.0.0.1:8000/health to check the running server.
)

exit /b %EXIT_CODE%
