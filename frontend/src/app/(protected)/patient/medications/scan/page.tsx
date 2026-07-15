"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TablerIcon } from "@/components/ui/tabler-icons";
import { scanMedicineLabel, type MedicineOcrResult } from "@/features/ocr/api";
import { ApiError } from "@/lib/api-client";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export default function ScanMedicationPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<MedicineOcrResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
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
      setError("กรุณาเลือกหรือถ่ายรูปฉลากยาก่อน");
      return;
    }

    setError(null);
    setIsScanning(true);
    try {
      setResult(await scanMedicineLabel(file));
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "ไม่สามารถสแกนฉลากยาได้ กรุณาลองใหม่");
    } finally {
      setIsScanning(false);
    }
  }

  function useScannedData() {
    if (!result) return;
    sessionStorage.setItem(
      "medcare_ocr_medication",
      JSON.stringify({
        name: result.medicine_name,
        dosage: result.dosage,
        quantity: result.quantity,
        frequency: result.frequency,
        times: result.reminder_times,
        startDate: result.start_date,
        endDate: result.end_date,
        instructions: result.usage_instruction,
      }),
    );
    router.push("/patient/medications/new");
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6">
      <div>
        <Link href="/patient/medications" className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 font-semibold text-blue-600 transition-colors hover:bg-blue-100 hover:text-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
          <TablerIcon name="arrow-left" className="h-5 w-5" />
          กลับไปรายการยา
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-slate-950 md:text-4xl">สแกนฉลากยา</h1>
        <p className="mt-2 text-lg text-slate-600">ถ่ายหรือเลือกรูปฉลากยาที่เห็นชื่อยาและคำแนะนำชัดเจน</p>
      </div>

      <section className="grid gap-6 rounded-[24px] border border-border bg-white p-5 shadow-[0_10px_30px_rgba(20,46,86,0.07)] sm:p-7 lg:grid-cols-2">
        <div className="grid content-start gap-4">
          <div className="relative grid min-h-[320px] place-items-center overflow-hidden rounded-[20px] border-2 border-dashed border-blue-200 bg-blue-50/60">
            {previewUrl ? (
              <Image src={previewUrl} alt="ตัวอย่างฉลากยาที่เลือก" fill unoptimized className="object-contain p-3" />
            ) : (
              <div className="grid place-items-center gap-3 px-6 text-center text-slate-500">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm">
                  <TablerIcon name="scan" className="h-8 w-8" />
                </span>
                <p className="font-semibold">ยังไม่ได้เลือกรูปฉลากยา</p>
                <p className="text-sm">รองรับ JPG, PNG, WebP สูงสุด 10 MB</p>
              </div>
            )}
          </div>

          <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-5 py-3 font-semibold text-navy-800 shadow-sm transition-[background-color,border-color,box-shadow] hover:border-blue-200 hover:bg-blue-50 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
            <TablerIcon name="scan" className="h-5 w-5" />
            {file ? "เปลี่ยนรูปภาพ" : "เลือกหรือถ่ายรูป"}
            <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={handleFileChange} className="sr-only" />
          </label>
          <Button icon={<TablerIcon name="scan" />} onClick={handleScan} disabled={!file || isScanning} full>
            {isScanning ? "กำลังประมวลผล OCR..." : "เริ่มสแกนฉลากยา"}
          </Button>
        </div>

        <div className="grid content-start gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">ข้อมูลการสแกน</h2>
            <p className="mt-1 text-slate-500">ตรวจสอบข้อมูลก่อนบันทึกทุกครั้ง</p>
          </div>

          {error ? <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700">{error}</p> : null}

          {result ? (
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["ชื่อยา", result.medicine_name],
                  ["ขนาดยา", result.dosage],
                  ["จำนวนต่อครั้ง", result.quantity],
                  ["ความถี่", result.frequency],
                  ["เวลาแจ้งเตือน", result.reminder_times.join(", ")],
                  ["ช่วงวันที่", result.start_date || result.end_date ? `${result.start_date || "ไม่ระบุ"} - ${result.end_date || "ไม่ระบุ"}` : ""],
                ].map(([label, value]) => (
                  <div className="rounded-xl bg-blue-50 p-4 ring-1 ring-blue-100" key={label}>
                    <p className="text-xs font-semibold text-slate-500">{label}</p>
                    <p className="mt-1.5 font-bold text-navy-900">{value || "อ่านข้อมูลไม่ได้"}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-cyan-50/70 p-4 ring-1 ring-cyan-100">
                <p className="text-sm font-semibold text-slate-500">คำแนะนำการใช้ยา</p>
                <p className="mt-1.5 leading-7 text-slate-800">{result.usage_instruction || "อ่านข้อมูลไม่ได้"}</p>
              </div>
              {result.needs_review ? (
                <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 font-semibold text-amber-800">
                  {result.warning || "อ่านข้อความได้ไม่ชัด กรุณาตรวจจากฉลากและกรอกคำแนะนำเอง"}
                </p>
              ) : null}
              {(!result.dosage || !result.quantity || !result.frequency) ? (
                <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
                  โมเดลส่งข้อมูลเฉพาะที่อ่านข้อความได้ ช่องที่ยังว่างจะไม่ถูกเดาค่า กรุณากรอกเพิ่มเติมในฟอร์มยา
                </p>
              ) : null}
              <Button icon={<TablerIcon name="check" />} onClick={useScannedData} full>
                ใช้ข้อมูลนี้ในฟอร์มยา
              </Button>
            </div>
          ) : (
            <div className="grid min-h-[260px] place-items-center rounded-[20px] bg-slate-50 px-6 text-center text-slate-400">
              <p>ข้อมูลจะแสดงที่นี่หลังจากสแกนสำเร็จ</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
