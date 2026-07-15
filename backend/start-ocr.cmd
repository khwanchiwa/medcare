@echo off
setlocal

set "OCR_PROJECT=%~dp0..\..\PJ_OCR69"
set "OCR_PYTHON=%~dp0..\.ocr-venv\Scripts\python.exe"

if not exist "%OCR_PROJECT%\api.py" (
  echo PJ_OCR69 was not found at: %OCR_PROJECT%
  exit /b 1
)

if not exist "%OCR_PYTHON%" (
  echo OCR Python environment was not found at: %OCR_PYTHON%
  exit /b 1
)

curl.exe --fail --silent --max-time 2 "http://127.0.0.1:8001/health" >nul 2>nul
if "%ERRORLEVEL%"=="0" (
  echo Local OCR is already running at http://127.0.0.1:8001
  exit /b 0
)

pushd "%OCR_PROJECT%"
echo Starting local PJ_OCR69 model at http://127.0.0.1:8001
"%OCR_PYTHON%" -m uvicorn api:app --host 127.0.0.1 --port 8001
set "EXIT_CODE=%ERRORLEVEL%"
popd
exit /b %EXIT_CODE%
