#!/usr/bin/env python3
"""
FastAPI server for OCR pipeline
Accepts image uploads and returns structured appointment/medicine data
"""
import logging
import os
import secrets
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any

from fastapi import Depends, FastAPI, File, Header, UploadFile, HTTPException
from fastapi.responses import JSONResponse

from core.ocr_pipeline import OCRPipeline

# Setup logger
logger = logging.getLogger("pj_ocr69.api")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter("%(asctime)s | %(levelname)s | %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)

# Initialize FastAPI app
app = FastAPI(
    title="OCR Pipeline API",
    description="Extract appointment and medicine label information from images",
    version="1.0.0",
)

# Initialize once and keep startup failures observable through readiness.
pipeline: OCRPipeline | None = None
pipeline_init_error: str | None = None
try:
    pipeline = OCRPipeline()
except Exception as exc:  # noqa: BLE001
    pipeline_init_error = f"{type(exc).__name__}: {exc}"
    logger.exception("Unable to initialize OCR pipeline")

MAX_IMAGE_SIZE = int(os.getenv("MAX_IMAGE_SIZE_BYTES", str(10 * 1024 * 1024)))
VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
VALID_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
OCR_API_KEY = os.getenv("OCR_API_KEY", "").strip()


def require_api_key(x_ocr_api_key: str | None = Header(default=None)) -> None:
    """Protect the public inference endpoint when OCR_API_KEY is configured."""
    if OCR_API_KEY and not secrets.compare_digest(x_ocr_api_key or "", OCR_API_KEY):
        raise HTTPException(status_code=401, detail="Invalid OCR API key")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "PJ_OCR69 OCR API"
    }


@app.get("/health/ready")
def readiness():
    if pipeline is None:
        raise HTTPException(
            status_code=503,
            detail={"status": "not_ready", "reason": pipeline_init_error or "pipeline unavailable"},
        )

    models: dict[str, Any] = {
        "yolo": pipeline.yolo_detector.readiness(),
        "paddleocr": pipeline.ocr_reader.readiness(),
    }
    if not all(model.get("ready") for model in models.values()):
        raise HTTPException(status_code=503, detail={"status": "not_ready", "models": models})
    return {"status": "ready", "models": models}


@app.post("/ocr/process")
async def process_image(
    file: UploadFile = File(...),
    _: None = Depends(require_api_key),
):
    """
    Process an image and extract structured data
    
    Args:
        file: Image file (JPG, PNG, etc.)
    
    Returns:
        JSON with status, document_type, and extracted data
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        # Check file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in VALID_EXTENSIONS or file.content_type not in VALID_CONTENT_TYPES:
            raise HTTPException(
                status_code=415,
                detail="Invalid image type. Allowed: JPG, PNG, WEBP",
            )
        
        logger.info(f"Processing file: {file.filename}")
        
        contents = await file.read(MAX_IMAGE_SIZE + 1)
        if not contents:
            raise HTTPException(status_code=400, detail="Image file is empty")
        if len(contents) > MAX_IMAGE_SIZE:
            raise HTTPException(status_code=413, detail="Image file is too large")

        # Save validated upload to a temporary location for the pipeline.
        with NamedTemporaryFile(suffix=file_ext, delete=False) as tmp_file:
            tmp_file.write(contents)
            tmp_path = tmp_file.name
        
        try:
            # Run pipeline
            if pipeline is None:
                raise HTTPException(status_code=503, detail="OCR models are not ready")
            result = pipeline.run(tmp_path)
            
            # Extract final_output (this has the clean 3-field format)
            final_output = result.get("final_output", {})
            
            # Enrich response with metadata
            response = {
                "filename": file.filename,
                "file_size": len(contents),
                **final_output,
            }
            
            logger.info(f"Processed {file.filename} -> {final_output.get('document_type', 'Unknown')}")
            return JSONResponse(content=response, status_code=200)
        
        finally:
            # Clean up temp file
            Path(tmp_path).unlink(missing_ok=True)
    
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error processing file %s", file.filename, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Internal OCR processing error",
        ) from exc


@app.get("/")
def root():
    """API info"""
    return {
        "service": "OCR Pipeline API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "readiness": "/health/ready",
            "process_image": "/ocr/process (POST)",
        },
        "docs": "/docs",
    }


import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "api:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8001")),
        workers=int(os.getenv("WORKERS", "1"))
    )
