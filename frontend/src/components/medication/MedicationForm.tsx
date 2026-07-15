"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { saveMedication, type MedicationRecord } from "@/features/health/api";
import { ApiError } from "@/lib/api-client";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { TablerIcon } from "../ui/tabler-icons";

const inputStyle = "!min-h-10 !py-2.5 border-slate-200 bg-slate-50/70 shadow-inner shadow-slate-100 transition-[background-color,border-color,box-shadow] focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100";

export function MedicationForm({
  mode,
  medication,
  patientId,
  returnTo = "/patient/dashboard",
  onSaved,
}: {
  mode: "edit" | "view";
  medication?: MedicationRecord;
  patientId?: string;
  returnTo?: string;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(medication?.name ?? "");
  const [dosage, setDosage] = useState(medication?.dosage ?? "");
  const [quantity, setQuantity] = useState(medication?.quantity ?? "1 เม็ด");
  const [frequency, setFrequency] = useState(medication?.frequency ?? "");
  const [times, setTimes] = useState<string[]>(medication?.reminder_times.length ? medication.reminder_times : [""]);
  const [instructions, setInstructions] = useState(medication?.instructions ?? "");
  const [startDate, setStartDate] = useState(medication?.start_date ?? "");
  const [endDate, setEndDate] = useState(medication?.end_date ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      await saveMedication(
        {
          name: name.trim(),
          dosage: dosage.trim(),
          quantity: quantity.trim(),
          frequency: frequency.trim(),
          reminder_times: times.map((value) => value.trim()).filter(Boolean),
          instructions: instructions.trim() || null,
          start_date: startDate || null,
          end_date: endDate || null,
        },
        medication?.id,
        patientId,
      );
      onSaved?.();
      router.push(returnTo);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "ไม่สามารถบันทึกรายการยาได้ กรุณาลองใหม่");
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    if (medication) return;
    const timer = window.setTimeout(() => {
      const stored = sessionStorage.getItem("medcare_ocr_medication");
      if (!stored) return;
      try {
        const scanned = JSON.parse(stored) as {
          name?: string;
          dosage?: string;
          quantity?: string;
          frequency?: string;
          times?: string[];
          startDate?: string;
          endDate?: string;
          instructions?: string;
        };
        setName(scanned.name ?? "");
        setDosage(scanned.dosage ?? "");
        setQuantity(scanned.quantity ?? "");
        setFrequency(scanned.frequency ?? "");
        setTimes(scanned.times?.length ? scanned.times : [""]);
        setStartDate(scanned.startDate ?? "");
        setEndDate(scanned.endDate ?? "");
        setInstructions(scanned.instructions ?? "");
      } catch {
        // Ignore invalid temporary OCR data and leave the form empty.
      } finally {
        sessionStorage.removeItem("medcare_ocr_medication");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [medication]);

  return (
    <Card className="mx-auto w-full max-w-5xl rounded-[24px] border-slate-200 bg-white/90 p-4 shadow-[0_10px_30px_rgba(20,46,86,0.06)] sm:p-5">
      <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
        <Input label="ชื่อยา" value={name} onChange={(event) => setName(event.target.value)} placeholder="เช่น Metformin" className={inputStyle} required />
        <Input label="ขนาดยา" value={dosage} onChange={(event) => setDosage(event.target.value)} placeholder="เช่น 500 mg" className={inputStyle} required />
        <Input label="จำนวนที่ทานต่อครั้ง" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="เช่น 1 เม็ด" className={inputStyle} required />
        <Input label="ความถี่ในการรับประทาน" value={frequency} onChange={(event) => setFrequency(event.target.value)} placeholder="เช่น วันละ 2 ครั้ง" className={inputStyle} required />
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <label className="font-semibold text-navy-900">เวลาแจ้งเตือน</label>
            <button
              type="button"
              onClick={() => setTimes((current) => [...current, ""])}
              className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-blue-50 px-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
            >
              <TablerIcon name="plus" className="h-4 w-4" /> เพิ่มเวลา
            </button>
          </div>
          <div className="grid gap-2">
            {times.map((time, index) => (
              <div className="flex items-center gap-2" key={index}>
                <input
                  aria-label={`เวลาแจ้งเตือนครั้งที่ ${index + 1}`}
                  type="time"
                  value={time}
                  onChange={(event) => setTimes((current) => current.map((value, itemIndex) => itemIndex === index ? event.target.value : value))}
                  className={`min-h-10 w-full rounded-xl border px-4 py-2.5 font-mono text-base text-navy-900 ${inputStyle}`}
                />
                {times.length > 1 ? (
                  <button
                    type="button"
                    aria-label={`ลบเวลาแจ้งเตือนครั้งที่ ${index + 1}`}
                    onClick={() => setTimes((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
                  >
                    <TablerIcon name="x" className="h-5 w-5" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <Input label="วันเริ่มต้น" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={inputStyle} />
        <Input label="วันสิ้นสุด" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={inputStyle} />
        <div className="md:col-span-2">
          <Input label="คำแนะนำ" value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="เช่น ทานหลังอาหาร" className={inputStyle} />
        </div>
        {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 md:col-span-2" role="alert">{error}</p> : null}
        <div className="flex justify-end border-t border-slate-100 pt-3 md:col-span-2 [&_button]:min-h-10 [&_button]:px-4 [&_button]:py-2 [&_button]:text-sm">
          <Button disabled={isSaving} icon={<TablerIcon name="check" />} type="submit">{isSaving ? "กำลังบันทึก..." : mode === "edit" ? "บันทึกการแก้ไขยา" : "เพิ่มยาใหม่"}</Button>
        </div>
      </form>
    </Card>
  );
}
