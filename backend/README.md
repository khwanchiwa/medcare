# MedCare Backend — FastAPI + Supabase

Backend สำหรับ frontend ของ MedCare โดย FastAPI เป็นชั้น REST API/business logic และ Supabase
รับผิดชอบ Authentication กับ PostgreSQL database

## Stack

- FastAPI + Pydantic
- Supabase Auth สำหรับ email/password, access token และ refresh token
- Supabase Data API (`supabase-py`) สำหรับอ่านและเขียน PostgreSQL
- Supabase SQL migrations + Row Level Security (RLS)
- Pytest โดยไม่ต้องเชื่อม Supabase จริงระหว่าง unit test

## โครงสร้าง

```text
backend/
├── app/
│   ├── api/
│   │   ├── deps.py                 # ตรวจ Supabase token, role และ permission
│   │   ├── router.py
│   │   └── routes/                 # auth, users, medications, appointments ฯลฯ
│   ├── core/config.py              # environment settings
│   ├── database/supabase.py        # public/admin Supabase client factories
│   ├── models/enums.py             # domain enums
│   ├── repositories/base.py        # reusable Supabase CRUD repository
│   ├── schemas/                    # request/response contracts
│   ├── services/                   # notification และ integration workflows ในอนาคต
│   └── main.py
├── supabase/
│   └── migrations/
│       └── 202607140001_initial_schema.sql
├── tests/
├── .env.example
└── requirements.txt
```

## ตั้งค่า Supabase

1. สร้างโปรเจกต์ใน Supabase
2. นำ `Project URL`, `Publishable key` และ `Secret key` จาก Project Settings > API
   มาใส่ใน `.env`
3. เปิด SQL Editor แล้วรันไฟล์
   `supabase/migrations/202607140001_initial_schema.sql`

หากใช้ Supabase CLI สามารถเชื่อมโปรเจกต์และส่ง migration ด้วย:

```powershell
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Migration จะสร้าง:

- `profiles` ที่เชื่อมกับ `auth.users` พร้อม trigger สร้าง profile อัตโนมัติ
- `medications` และ `medication_logs`
- `appointments`
- `caregiver_relationships` พร้อม permission ราย domain
- `notifications`
- Index, validation constraint และ RLS policies ทุกตาราง

## เริ่ม FastAPI

ใช้ Python 3.11 ขึ้นไป จากโฟลเดอร์ `backend`:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

- API: `http://localhost:8000/api/v1`
- Swagger UI: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

ทดสอบด้วย:

```powershell
pytest
```

## Security model

- Frontend ส่ง Supabase access token ผ่าน `Authorization: Bearer <token>`
- FastAPI ตรวจ token กับ Supabase Auth และโหลด role จาก `profiles`
- Secret key ใช้เฉพาะ FastAPI และห้ามใช้ชื่อ environment ที่ขึ้นต้นด้วย `NEXT_PUBLIC_`
- เนื่องจาก secret key ข้าม RLS ได้ FastAPI จึงตรวจ ownership/relationship/permission ก่อนทุก write
- RLS ใน migration เป็น defense-in-depth สำหรับการเรียก Data API ด้วย publishable key
- Role ที่ผู้ใช้เลือกเองตอนสมัครรับได้เฉพาะ `PATIENT` หรือ `CAREGIVER`; trigger จะไม่สร้าง `ADMIN`

## Endpoint หลัก

| Domain | Endpoint |
|---|---|
| Auth | `/api/v1/auth/register`, `/login`, `/refresh`, `/logout` |
| Profile | `/api/v1/users/me` |
| Medications | `/api/v1/medications`, `/{id}`, `/{id}/check-in`, `/logs` |
| Appointments | `/api/v1/appointments`, `/{id}` |
| Patient–caregiver | `/api/v1/relationships`, `/invite`, `/{id}/respond` |
| Notifications | `/api/v1/notifications`, `/{id}/read`, `/read-all` |
| Dashboard | `/api/v1/dashboard/patient`, `/caregiver` |
| OCR | `/api/v1/ocr/medicine` |

เวลา datetime ควรส่งเป็น ISO 8601 พร้อม timezone เช่น `2026-07-14T08:00:00+07:00`

## Google Calendar

1. รัน migrations `supabase/migrations/202607150001_notification_integrations.sql` และ `202607150003_google_calendar_sync.sql`
2. ตั้งค่า `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` และ `GOOGLE_TOKEN_ENCRYPTION_KEY` ใน `.env`
3. Google OAuth redirect URI ต้องตรงกับ `GOOGLE_REDIRECT_URI`

สร้าง encryption key หนึ่งครั้งด้วย `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` และเก็บเป็น server secret เท่านั้น ห้ามเปลี่ยน key ขณะที่ยังมี token เดิมในฐานข้อมูล

ระบบสร้าง แก้ไข และลบ Google Calendar Event เมื่อนัดหมายใน MedCare เปลี่ยน

## เชื่อม OCR service (`ocr-service`)

MedCare เรียกโมเดล OCR ผ่าน FastAPI ใน `ocr-service` ที่พอร์ต `8001` แล้วส่งภาพผ่าน
Backend endpoint `/api/v1/ocr/medicine` เพื่อเก็บ access token และการตรวจไฟล์ไว้ฝั่งเซิร์ฟเวอร์

`ocr-service` อยู่ภายใน repo medcare เดียวกัน:

```text
medcare\
├── backend\
├── frontend\
└── ocr-service\
```

เปิด OCR API ใน Terminal แยกจาก MedCare Backend:

```powershell
cd <path-to>\medcare
.\backend\start-ocr.ps1
```

- OCR health check: `http://127.0.0.1:8001/health`
- ค่าเชื่อมต่อใน `.env`: `OCR_API_URL=http://127.0.0.1:8001`
- Frontend: `/patient/medications/scan`
- รองรับ JPG, PNG และ WebP ขนาดไม่เกิน 10 MB
