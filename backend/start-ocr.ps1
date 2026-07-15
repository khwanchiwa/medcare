$ErrorActionPreference = "Stop"

# The OCR service lives in the medcare repo at ..\ocr-service. The legacy
# standalone PJ_OCR69 layouts are kept as fallbacks for older checkouts.
$ocrCandidates = @(
    [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\ocr-service")),
    [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\PJ_OCR69")),
    [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\..\PJ_OCR69"))
)
$ocrProject = $ocrCandidates | Where-Object { Test-Path -LiteralPath (Join-Path $_ "api.py") } | Select-Object -First 1
$ocrPython = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\.ocr-venv\Scripts\python.exe"))

if (-not $ocrProject) {
    throw "OCR service was not found at any of: $($ocrCandidates -join ', ')"
}

if (-not (Test-Path -LiteralPath $ocrPython)) {
    throw "OCR Python environment was not found at: $ocrPython"
}

Write-Host "Starting OCR service API at http://127.0.0.1:8001" -ForegroundColor Cyan
Push-Location $ocrProject
try {
    & $ocrPython -m uvicorn api:app --host 127.0.0.1 --port 8001
}
finally {
    Pop-Location
}
