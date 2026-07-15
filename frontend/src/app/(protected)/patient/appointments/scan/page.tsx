"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TablerIcon } from "@/components/ui/tabler-icons";
import { scanAppointment, type AppointmentOcrResult } from "@/features/ocr/api";
import { ApiError } from "@/lib/api-client";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const THAI_MONTHS: Record<string, number> = {
  มกราคม: 1, "ม.ค.": 1, กุมภาพันธ์: 2, "ก.พ.": 2, มีนาคม: 3, "มี.ค.": 3,
  เมษายน: 4, "เม.ย.": 4, พฤษภาคม: 5, "พ.ค.": 5, มิถุนายน: 6, "มิ.ย.": 6,
  กรกฎาคม: 7, "ก.ค.": 7, สิงหาคม: 8, "ส.ค.": 8, กันยายน: 9, "ก.ย.": 9,
  ตุลาคม: 10, "ต.ค.": 10, พฤศจิกายน: 11, "พ.ย.": 11, ธันวาคม: 12, "ธ.ค.": 12,
};

function normalizeThaiDigits(value: string) {
  return value.replace(/[๐-๙]/g, (digit) => String("๐๑๒๓๔๕๖๗๘๙".indexOf(digit)));
}

function toGregorianYear(year: number) {
  return year >= 2400 ? year - 543 : year;
}

function parseAppointmentDate(value: string): string {
  const normalized = normalizeThaiDigits(value.trim());
  const numeric = normalized.match(/(\d{1,4})[\/-](\d{1,2})[\/-](\d{1,4})/);
  if (numeric) {
    const isoFirst = numeric[1].length === 4;
    const year = toGregorianYear(Number(isoFirst ? numeric[1] : numeric[3]));
    const month = Number(numeric[2]);
    const day = Number(isoFirst ? numeric[3] : numeric[1]);
    return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
  }

  const thaiDate = normalized.match(/(\d{1,2})\s+([^\s]+)\s+(\d{4})/);
  if (!thaiDate) return "";
  const month = THAI_MONTHS[thaiDate[2]];
  if (!month) return "";
  const year = toGregorianYear(Number(thaiDate[3]));
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${thaiDate[1].padStart(2, "0")}`;
}

function parseAppointmentTime(value: string): string {
  const matched = normalizeThaiDigits(value).match(/(\d{1,2})[:.](\d{2})/);
  if (!matched) return "";
  return `${matched[1].padStart(2, "0")}:${matched[2]}`;
}

export default function ScanAppointmentPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AppointmentOcrResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parsedDate = useMemo(() => parseAppointmentDate(result?.appointment_date ?? ""), [result]);
  const parsedTime = useMemo(() => parseAppointmentTime(result?.appointment_time ?? ""), [result]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setError(null);
    setResult(null);
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setError("กรุณาเลือกไฟล์รูปภาพ JPG, PNG หรือ WebP");
      event.target.value = "";
      return;
    }
    if (selected.size > MAX_IMAGE_SIZE) {
      setError("ไฟล์ภาพต้องมีขนาดไม่เกิน 10 MB");
      event.target.value = "";
      return;
    }
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  async function handleScan() {
    if (!file) {
      setError("กรุณาเลือกหรือถ่ายรูปใบนัดก่อน");
      return;
    }
    setError(null);
    setIsScanning(true);
    try {
      setResult(await scanAppointment(file));
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "ไม่สามารถสแกนใบนัดได้ กรุณาลองใหม่");
    } finally {
      setIsScanning(false);
    }
  }

  function useScannedData() {
    if (!result) return;
    sessionStorage.setItem("medcare_ocr_appointment", JSON.stringify({
      date: parsedDate,
      time: parsedTime,
      notes: result.preparation_instruction,
      rawDate: result.appointment_date,
      rawTime: result.appointment_time,
    }));
    router.push("/patient/appointments/new");
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6">
      <div>
        <Link href="/patient/appointments" className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 font-semibold text-blue-600 transition-colors hover:bg-blue-100 hover:text-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
          <TablerIcon name="arrow-left" className="h-5 w-5" /> กลับไปหน้านัดหมาย
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-slate-950 md:text-4xl">สแกนใบนัด</h1>
        <p className="mt-2 text-lg text-slate-600">ถ่ายหรือเลือกรูปใบนัดที่เห็นวันที่ เวลา และข้อปฏิบัติก่อนพบแพทย์ให้ชัดเจน</p>
      </div>

      <section className="grid gap-6 rounded-[24px] border border-border bg-white p-5 shadow-[0_10px_30px_rgba(20,46,86,0.07)] sm:p-7 lg:grid-cols-2">
        <div className="grid content-start gap-4">
          <div className="relative grid min-h-[320px] place-items-center overflow-hidden rounded-[20px] border-2 border-dashed border-blue-200 bg-blue-50/60">
            {previewUrl ? <Image src={previewUrl} alt="ตัวอย่างใบนัดที่เลือก" fill unoptimized className="object-contain p-3" /> : (
              <div className="grid place-items-center gap-3 px-6 text-center text-slate-500">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm"><TablerIcon name="calendar-time" className="h-8 w-8" /></span>
                <p className="font-semibold">ยังไม่ได้เลือกรูปใบนัด</p>
                <p className="text-sm">รองรับ JPG, PNG, WebP สูงสุด 10 MB</p>
              </div>
            )}
          </div>
          <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-5 py-3 font-semibold text-navy-800 shadow-sm transition-[background-color,border-color,box-shadow] hover:border-blue-200 hover:bg-blue-50 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
            <TablerIcon name="scan" className="h-5 w-5" /> {file ? "เปลี่ยนรูปภาพ" : "เลือกหรือถ่ายรูป"}
            <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={handleFileChange} className="sr-only" />
          </label>
          <Button icon={<TablerIcon name="scan" />} onClick={handleScan} disabled={!file || isScanning} full>{isScanning ? "กำลังประมวลผล OCR..." : "เริ่มสแกนใบนัด"}</Button>
        </div>

        <div className="grid content-start gap-4">
          <div><h2 className="text-2xl font-bold text-slate-950">ผลการสแกน</h2><p className="mt-1 text-slate-500">ตรวจสอบข้อมูลก่อนนำไปกรอกในฟอร์มนัดหมาย</p></div>
          {error ? <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700">{error}</p> : null}
          {result ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100"><p className="text-sm font-semibold text-slate-500">วันที่</p><p className="mt-2 font-bold text-navy-900">{result.appointment_date || "ไม่พบ"}</p></div>
                <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100"><p className="text-sm font-semibold text-slate-500">เวลา</p><p className="mt-2 font-bold text-navy-900">{result.appointment_time || "ไม่พบ"}</p></div>
              </div>
              <div className="rounded-2xl bg-cyan-50/70 p-5 ring-1 ring-cyan-100"><p className="text-sm font-semibold text-slate-500">ข้อปฏิบัติก่อนพบแพทย์</p><p className="mt-2 leading-7 text-slate-800">{result.preparation_instruction || "ไม่พบคำแนะนำ"}</p></div>
              {(!parsedDate || !parsedTime) ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">ระบบอ่านข้อมูลได้บางส่วน กรุณาตรวจวันที่และเวลาอีกครั้งในฟอร์ม</p> : null}
              <Button icon={<TablerIcon name="check" />} onClick={useScannedData} full>ใช้ข้อมูลนี้ในฟอร์มนัดหมาย</Button>
            </div>
          ) : <div className="grid min-h-[260px] place-items-center rounded-[20px] bg-slate-50 px-6 text-center text-slate-400"><p>ข้อมูลจะแสดงที่นี่หลังจากสแกนสำเร็จ</p></div>}
        </div>
      </section>
    </div>
  );
}
