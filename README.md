# MedCare

แอปช่วยดูแลสุขภาพ: จัดการยา จัดการนัดหมาย และ **สแกนฉลากยา/ใบนัดด้วย AI OCR**

Monorepo นี้มี 3 ส่วน:

```text
medcare/
├── frontend/      # Next.js (เว็บผู้ใช้)                 → พอร์ต 3000
├── backend/       # FastAPI + Supabase (REST API/auth)  → พอร์ต 8000
└── ocr-service/   # AI OCR: YOLO + PaddleOCR (FastAPI)   → พอร์ต 8001
```

## สถาปัตยกรรม

```text
[Browser] → [frontend :3000] → [backend :8000] → [ocr-service :8001]
                                     │                    (YOLO + PaddleOCR)
                                     └→ [Supabase] (auth + PostgreSQL)
```

- Frontend เรียก backend ผ่าน proxy `/api/backend/*` (dev) หรือ `NEXT_PUBLIC_API_BASE_URL` (prod)
- Backend proxy ภาพไป ocr-service ที่ `OCR_API_URL` แล้วแนบ auth/ตรวจไฟล์ให้ฝั่งเซิร์ฟเวอร์
- Frontend เหมาะกับ **Vercel** ส่วน backend + ocr-service รันเป็น **Docker** (ดู `docker-compose.yml`)

## สิ่งที่ต้องมี (Prerequisites)

- **Python 3.11** (จำเป็นสำหรับ ocr-service — `numpy 1.26.4` ยังไม่มี wheel สำหรับ 3.14)
- **Node.js 20+** (frontend)
- **Supabase project** (auth + database)
- (ทางเลือก) **Docker** — สำหรับรัน backend + ocr แบบ container

> ℹ️ ไฟล์โมเดล OCR (`ocr-service/models/…` รวม ~14MB) ถูก track ไว้ใน repo แล้ว **ไม่ต้องดาวน์โหลดเพิ่ม**

---

## 1) ตั้งค่า Supabase (ทำก่อนเสมอ)

1. สร้าง project ใน [Supabase](https://supabase.com)
2. เปิด **SQL Editor** แล้วรันไฟล์ใน `backend/supabase/migrations/` **ตามลำดับ**:
   ```
   202607140001_initial_schema.sql
   202607140002_adapt_existing_users.sql
   202607140003_simplify_appointments.sql
   202607140004_legacy_caregiver_invitations.sql
   202607150001_notification_integrations.sql
   202607150002_remove_line_integration.sql
   ```
3. เอา `Project URL`, `Publishable key`, `Secret key` จาก **Project Settings > API** ไปใส่ `backend/.env` (ขั้นถัดไป)

## 2) ตั้งค่า Environment

```powershell
Copy-Item backend/.env.example backend/.env
```
แก้ `backend/.env` ให้มีค่าจริงของ Supabase:

| ตัวแปร | คำอธิบาย |
|---|---|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key |
| `SUPABASE_SECRET_KEY` | Secret key (ฝั่ง backend เท่านั้น — **ห้าม commit / ห้ามขึ้นต้นด้วย `NEXT_PUBLIC_`**) |
| `OCR_API_URL` | URL ของ ocr-service (default `http://127.0.0.1:8001`) |
| `FRONTEND_ORIGINS` / `FRONTEND_ORIGIN_REGEX` | โดเมน frontend ที่อนุญาต (CORS) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | (ทางเลือก) Google Calendar |

> 🔒 `backend/.env` ถูก gitignore ไว้แล้ว — **อย่า commit secret ขึ้น git**

---

## รันแบบ Local (Windows PowerShell) — 3 terminal แยก

### Terminal 1 — OCR service (พอร์ต 8001)
```powershell
py -3.11 -m venv .ocr-venv
.\.ocr-venv\Scripts\python.exe -m pip install -r ocr-service\requirements.txt
.\backend\start-ocr.ps1
```
เช็ค: `http://127.0.0.1:8001/health/ready`

### Terminal 2 — Backend (พอร์ต 8000)
```powershell
py -3.11 -m venv backend\.venv
.\backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --app-dir backend
```
เช็ค: `http://127.0.0.1:8000/health` · Swagger: `http://127.0.0.1:8000/docs`

### Terminal 3 — Frontend (พอร์ต 3000)
```powershell
npm install --prefix frontend
npm run dev --prefix frontend
```
เปิด `http://localhost:3000` (proxy `/api/backend/*` ไป backend อัตโนมัติ)

---

## รันแบบ Docker (backend + ocr-service)

ต้องมี `backend/.env` (ตามขั้นที่ 2) พร้อมค่าจริงก่อน แล้ว:
```bash
docker compose up --build
```
- ครั้งแรก build จะนาน (ติดตั้ง torch/paddle — image ใหญ่หลาย GB)
- Backend: `http://localhost:8000` · ocr-service อยู่ **ภายใน network** (backend เรียก `http://ocr:8001`, ไม่เปิดสู่ host)
- Frontend deploy แยกบน Vercel แล้วตั้ง `NEXT_PUBLIC_API_BASE_URL` ให้ชี้มาโดเมน backend

หยุด: `docker compose down`

---

## Deploy production (แนะนำ)

| ส่วน | โฮสต์ | หมายเหตุ |
|---|---|---|
| frontend | **Vercel** | ตั้ง `NEXT_PUBLIC_API_BASE_URL=https://<backend-domain>/api/v1` |
| backend | Docker (Render / Railway / Cloud Run / VPS) | ใช้ `backend/.env.production.example` เป็นแม่แบบ, วางหลัง HTTPS |
| ocr-service | Docker (โฮสต์เดียวกับ backend) หรือ **Hugging Face Spaces** | ถ้าใช้ HF: image รันพอร์ต `7860` (ดู header ใน `ocr-service/README.md`) |

---

## ส่งต่อให้คนอื่นใช้ (Deploy for others)

repo นี้ไม่มี state ผูกกับผู้พัฒนาเดิม — ใครก็ deploy ได้ด้วย Supabase + config ของตัวเอง
สิ่งที่ผู้เอาไปใช้ต้องเตรียม (ไม่มีใน repo โดยตั้งใจ):

**1. Supabase ของตัวเอง** — สร้าง project, รัน migration (หัวข้อที่ 1), แล้วเอา keys ใส่
`backend/.env` (ไฟล์นี้ถูก gitignore — ต้องสร้างเอง ไม่ได้มากับ repo)

**2. backend + ocr-service ต้องอยู่บนโฮสต์ที่มี public URL + HTTPS** (ไม่ใช่ localhost)
- Vercel อยู่บนอินเทอร์เน็ตสาธารณะ จึง **เรียก backend ที่ `localhost` ไม่ได้**
- โฮสต์จริง: VPS / Cloud Run / Railway แล้ว `docker compose up --build -d`
- อยากทดสอบเร็วๆ จากเครื่องตัวเอง เปิด tunnel ไปที่ backend แล้วเอา URL ไปใส่ Vercel:
  ```bash
  cloudflared tunnel --url http://localhost:8000
  # หรือ    ngrok http 8000
  ```

**3. Vercel (frontend)**
- ตั้ง env `NEXT_PUBLIC_API_BASE_URL=https://<backend-domain>/api/v1` (เป็น build-time — ต้องตั้งก่อน build)
- ตั้ง `FRONTEND_ORIGINS` / `FRONTEND_ORIGIN_REGEX` ที่ backend ให้ครอบคลุมโดเมน Vercel
  (regex อนุญาต `*.vercel.app` อยู่แล้ว — ถ้าใช้ custom domain ต้องเพิ่มเอง)

**ความปลอดภัย**
- ocr-service ไม่เปิดสู่ภายนอก มีแค่ backend เรียกผ่าน network ภายใน
- `backend/.env` (secret) เป็นของแต่ละผู้ deploy — **อย่า commit ขึ้น git**

---

## หมายเหตุ

- **OCR รันบน CPU ได้เลย ไม่ต้องมี GPU/LLM ภายนอก** — ตัวช่วย Gemma เป็น optional ปิดไว้โดย default (`USE_GEMMA=false`)
- **พอร์ต ocr-service:** local/Docker ใช้ `8001`, Hugging Face ใช้ `7860` (`docker-compose.yml` override ให้เป็น 8001 ให้แล้ว)
- **`OCR_API_KEY`:** ถ้าจะเปิดใช้ ต้องแก้ backend (`backend/app/api/routes/ocr.py`) ให้ส่ง header `X-OCR-API-Key` ด้วย ปัจจุบันยังไม่ส่ง — ปกติ ocr-service ถูกปิดไม่ให้เข้าจากภายนอกอยู่แล้ว
- รายละเอียดแต่ละส่วนดูที่ [`backend/README.md`](backend/README.md), [`frontend/README.md`](frontend/README.md), [`ocr-service/README.md`](ocr-service/README.md)
