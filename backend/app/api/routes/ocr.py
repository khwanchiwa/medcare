from pathlib import Path
import re

import httpx
from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.api.deps import CurrentUser
from app.core.config import settings

router = APIRouter()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024


def _clean_ocr_value(value: object) -> str:
    text = str(value or "").strip()
    return "" if text in {"ไม่พบ", "ไม่ระบุ", "None", "null"} else text


def _thai_digits_to_arabic(value: str) -> str:
    return value.translate(str.maketrans("๐๑๒๓๔๕๖๗๘๙", "0123456789"))


def _medicine_form_fields(medicine_name: str, instruction: str) -> dict:
    normalized_name = _thai_digits_to_arabic(medicine_name)
    normalized_instruction = _thai_digits_to_arabic(instruction)
    dosage_match = re.search(r"(?i)(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|มก\.?|ไมโครกรัม|กรัม|มล\.?))", normalized_name)
    quantity_match = re.search(r"ครั้งละ\s*([^,.]+?(?:เม็ด|แคปซูล|ช้อนชา|ช้อนโต๊ะ|มล\.?))", normalized_instruction)
    frequency_match = re.search(r"((?:วันละ\s*[^,.]+?ครั้ง)|(?:ทุก\s*\d+(?:\s*[-–]\s*\d+)?\s*ชั่วโมง)|(?:เมื่อมีอาการ))", normalized_instruction)
    explicit_times = re.findall(r"(?<!\d)([01]?\d|2[0-3])[:.]([0-5]\d)(?!\d)", normalized_instruction)
    reminder_times = list(dict.fromkeys(f"{hour.zfill(2)}:{minute}" for hour, minute in explicit_times))
    return {
        "dosage": dosage_match.group(1).strip() if dosage_match else "",
        "quantity": quantity_match.group(1).strip() if quantity_match else "",
        "frequency": frequency_match.group(1).strip() if frequency_match else "",
        "reminder_times": reminder_times,
        "start_date": "",
        "end_date": "",
    }


async def _process_document(
    file: UploadFile,
    expected_type: str,
    invalid_document_message: str,
) -> dict:
    filename = Path(file.filename or "document.jpg").name
    extension = Path(filename).suffix.lower()
    if file.content_type not in ALLOWED_IMAGE_TYPES or extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="รองรับเฉพาะไฟล์ JPG, PNG และ WebP",
        )

    contents = await file.read(MAX_IMAGE_SIZE + 1)
    if not contents:
        raise HTTPException(status_code=400, detail="ไฟล์ภาพว่างเปล่า")
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail="ไฟล์ภาพต้องมีขนาดไม่เกิน 10 MB")

    try:
        async with httpx.AsyncClient(timeout=settings.ocr_timeout_seconds) as client:
            response = await client.post(
                f"{settings.ocr_api_url.rstrip('/')}/ocr/process",
                files={"file": (filename, contents, file.content_type)},
            )
    except httpx.TimeoutException as exc:
        raise HTTPException(
            status_code=504,
            detail="โมเดล OCR ใช้เวลาประมวลผลนานเกินไป กรุณาลองใหม่",
        ) from exc
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=503,
            detail="ไม่สามารถเชื่อมต่อโมเดล OCR ได้ กรุณาเปิดบริการ PJ_OCR69 ที่พอร์ต 8001",
        ) from exc

    if response.status_code >= 400:
        try:
            upstream_payload = response.json()
            upstream_detail = (
                upstream_payload.get("detail")
                if isinstance(upstream_payload, dict)
                else None
            )
        except ValueError:
            upstream_detail = None
        raise HTTPException(
            status_code=502,
            detail=upstream_detail or "โมเดล OCR ไม่สามารถประมวลผลภาพนี้ได้",
        )

    try:
        result = response.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=502,
            detail="บริการ OCR ส่งข้อมูลตอบกลับในรูปแบบที่ไม่ถูกต้อง",
        ) from exc
    if not isinstance(result, dict):
        raise HTTPException(
            status_code=502,
            detail="บริการ OCR ส่งข้อมูลตอบกลับในรูปแบบที่ไม่ถูกต้อง",
        )
    if result.get("status") != "success":
        raise HTTPException(
            status_code=422,
            detail=result.get("error") or "ไม่สามารถอ่านข้อความจากภาพได้",
        )
    if result.get("document_type") != expected_type:
        raise HTTPException(
            status_code=422,
            detail=invalid_document_message,
        )
    return result


@router.post("/medicine")
async def scan_medicine_label(
    current_user: CurrentUser,
    file: UploadFile = File(...),
) -> dict:
    """Proxy a medicine-label image to the local PJ_OCR69 service."""
    result = await _process_document(
        file,
        expected_type="MedicineLabel",
        invalid_document_message="ภาพนี้ไม่ใช่ฉลากยา กรุณาถ่ายภาพฉลากยาให้ชัดเจน",
    )

    data = result.get("data") or {}
    medicine_name = _clean_ocr_value(data.get("medicine_name"))
    instruction = _clean_ocr_value(data.get("usage_instruction"))
    # _clean_ocr_value maps "ไม่พบ" (and blanks) to "", so review when nothing usable remains.
    needs_review = not instruction or "low_usage_ocr_confidence" in str(result.get("error") or "")
    form_fields = _medicine_form_fields(medicine_name, "" if needs_review else instruction)
    return {
        "document_type": "MedicineLabel",
        "medicine_name": medicine_name,
        **form_fields,
        "usage_instruction": "" if needs_review else instruction,
        "needs_review": needs_review,
        "warning": (
            "อ่านข้อความคำแนะนำการใช้ยาได้ไม่ชัด กรุณาตรวจจากฉลากและกรอกเอง"
            if needs_review
            else None
        ),
    }


@router.post("/appointment")
async def scan_appointment(
    current_user: CurrentUser,
    file: UploadFile = File(...),
) -> dict:
    """Proxy an appointment image to the local PJ_OCR69 service."""
    result = await _process_document(
        file,
        expected_type="Appointment",
        invalid_document_message="ภาพนี้ไม่ใช่ใบนัด กรุณาถ่ายภาพใบนัดให้ชัดเจน",
    )
    data = result.get("data") or {}
    return {
        "document_type": "Appointment",
        "appointment_date": _clean_ocr_value(data.get("appointment_date")),
        "appointment_time": _clean_ocr_value(data.get("appointment_time")),
        "preparation_instruction": _clean_ocr_value(data.get("preparation_instruction")),
    }
