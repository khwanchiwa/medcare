$ErrorActionPreference = "Stop"

$ocrProject = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\..\PJ_OCR69"))
$ocrPython = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\.ocr-venv\Scripts\python.exe"))

if (-not (Test-Path -LiteralPath (Join-Path $ocrProject "api.py"))) {
    throw "PJ_OCR69 was not found at: $ocrProject"
}

if (-not (Test-Path -LiteralPath $ocrPython)) {
    throw "OCR Python environment was not found at: $ocrPython"
}

Write-Host "Starting PJ_OCR69 API at http://127.0.0.1:8001" -ForegroundColor Cyan
Push-Location $ocrProject
try {
    & $ocrPython -m uvicorn api:app --host 127.0.0.1 --port 8001
}
finally {
    Pop-Location
}
