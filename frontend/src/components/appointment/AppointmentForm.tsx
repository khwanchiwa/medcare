"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { saveAppointment, type AppointmentRecord } from "@/features/health/api";
import { ApiError } from "@/lib/api-client";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { TablerIcon } from "../ui/tabler-icons";

const inputStyle = "!min-h-10 !py-2.5 border-slate-200 bg-slate-50/70 shadow-inner shadow-slate-100 transition-[background-color,border-color,box-shadow] focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100";

export function AppointmentForm({
  appointment,
  patientId,
  returnTo = "/patient/dashboard",
  onSaved,
}: {
  appointment?: AppointmentRecord;
  patientId?: string;
  returnTo?: string;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(appointment?.title ?? "");
  const [date, setDate] = useState(appointment?.appointment_date ?? "");
  const [time, setTime] = useState(appointment?.appointment_time.slice(0, 5) ?? "");
  const [notes, setNotes] = useState(appointment?.notes ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      await saveAppointment(
        {
          title: title.trim(),
          hospital: appointment?.hospital ?? null,
          appointment_date: date,
          appointment_time: time,
          notes: notes.trim() || null,
        },
        appointment?.id,
        patientId,
      );
      onSaved?.();
      router.push(returnTo);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "ไม่สามารถบันทึกนัดหมายได้ กรุณาลองใหม่");
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    if (appointment) return;
    const timer = window.setTimeout(() => {
      const stored = sessionStorage.getItem("medcare_ocr_appointment");
      if (!stored) return;
      try {
        const scanned = JSON.parse(stored) as { date?: string; time?: string; notes?: string };
        setDate(scanned.date ?? "");
        setTime(scanned.time ?? "");
        setNotes(scanned.notes ?? "");
      } catch {
        // Ignore invalid temporary OCR data and leave the form empty.
      } finally {
        sessionStorage.removeItem("medcare_ocr_appointment");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [appointment]);

  return (
    <Card className="mx-auto w-full max-w-4xl rounded-[24px] border-slate-200 bg-white/90 p-4 shadow-[0_10px_30px_rgba(20,46,86,0.06)] sm:p-5">
      <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
        <div className="md:col-span-2">
          <Input label="ชื่อนัดหมาย" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="เช่น ตรวจติดตามความดัน" className={inputStyle} required />
        </div>
        <Input label="วันที่นัด" type="date" value={date} onChange={(event) => setDate(event.target.value)} className={inputStyle} required />
        <Input label="เวลาที่นัด" type="time" value={time} onChange={(event) => setTime(event.target.value)} className={inputStyle} required />
        <div className="md:col-span-2">
          <Input label="ข้อปฏิบัติก่อนพบแพทย์" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="เช่น งดอาหารและน้ำหลังเที่ยงคืน" className={inputStyle} />
        </div>
        {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 md:col-span-2" role="alert">{error}</p> : null}
        <div className="flex justify-end border-t border-slate-100 pt-3 md:col-span-2 [&_button]:min-h-10 [&_button]:px-4 [&_button]:py-2 [&_button]:text-sm">
          <Button disabled={isSaving} icon={<TablerIcon name="check" />} type="submit">{isSaving ? "กำลังบันทึก..." : appointment ? "บันทึกการแก้ไขนัดหมาย" : "สร้างนัดหมายใหม่"}</Button>
        </div>
      </form>
    </Card>
  );
}
