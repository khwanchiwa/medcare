"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, PageTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TablerIcon } from "@/components/ui/tabler-icons";
import { deleteAppointment, listAppointments, type AppointmentRecord } from "@/features/health/api";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "long", timeZone: "Asia/Bangkok" }).format(new Date(`${value}T00:00:00+07:00`));
}

export default function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [appointment, setAppointment] = useState<AppointmentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listAppointments()
      .then((items) => {
        const item = items.find((record) => record.id === id);
        if (item) setAppointment(item);
        else setError("ไม่พบนัดหมายนี้");
      })
      .catch(() => setError("ไม่สามารถโหลดข้อมูลนัดหมายได้"))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleDelete() {
    setIsDeleting(true);
    setError("");
    try {
      await deleteAppointment(id);
      router.push("/patient/appointments");
      router.refresh();
    } catch {
      setError("ไม่สามารถลบนัดหมายได้ กรุณาลองใหม่");
      setIsDeleting(false);
    }
  }

  if (isLoading) return <Skeleton label="กำลังโหลดข้อมูลนัดหมาย" />;
  if (!appointment) return <Card className="grid min-h-[180px] place-items-center text-center font-semibold text-slate-400">{error}</Card>;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5">
      <div>
        <Button href="/patient/appointments" icon={<TablerIcon name="arrow-left" />} variant="secondary">กลับไปหน้ารวมนัดหมาย</Button>
      </div>

      <PageTitle title="รายละเอียดนัดหมาย" subtitle="ตรวจสอบวัน เวลา สถานที่ และข้อมูลที่ต้องเตรียม" />

      <Card className="overflow-hidden rounded-[24px] border-blue-100 bg-white/95 p-0 shadow-[0_12px_34px_rgba(20,46,86,0.07)]">
        <div className="flex flex-col gap-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-white p-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
              <TablerIcon name="calendar-time" className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-navy-900 sm:text-2xl">{appointment.title}</h1>
              <p className="mt-1 text-slate-600">{appointment.hospital || "ยังไม่ได้ระบุสถานที่"}</p>
            </div>
          </div>
          <Badge tone={appointment.status === "completed" ? "success" : appointment.status === "cancelled" ? "neutral" : "info"}>
            {appointment.status === "completed" ? "เสร็จสิ้น" : appointment.status === "cancelled" ? "ยกเลิกแล้ว" : "กำลังจะถึง"}
          </Badge>
        </div>

        <div className="grid gap-3 p-5 md:grid-cols-2 md:p-6">
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-sm font-semibold text-slate-500">วันที่นัดหมาย</p>
            <p className="mt-1.5 text-base font-bold text-navy-900">{formatDate(appointment.appointment_date)}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-sm font-semibold text-slate-500">เวลา</p>
            <p className="mt-1.5 text-base font-bold text-navy-900">{appointment.appointment_time.slice(0, 5)} น.</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-white p-4 md:col-span-2">
            <p className="text-sm font-semibold text-slate-500">หมายเหตุ</p>
            <p className="mt-1.5 text-base font-semibold text-navy-900">{appointment.notes || "ไม่มีหมายเหตุเพิ่มเติม"}</p>
          </div>
          {appointment.google_event_id ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 md:col-span-2">
              <TablerIcon name="check" className="h-5 w-5" /> บันทึกใน Google Calendar แล้ว
            </div>
          ) : null}
        </div>

        {error ? <p className="mx-5 mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 md:mx-6" role="alert">{error}</p> : null}
        <div className="grid gap-3 border-t border-blue-100 bg-slate-50/70 p-4 sm:grid-cols-2 md:px-6">
          <Button href={`/patient/appointments/${appointment.id}/edit`} icon={<TablerIcon name="edit" />} full>แก้ไขนัดหมาย</Button>
          <Button disabled={isDeleting} icon={<TablerIcon name="trash" />} onClick={handleDelete} variant="danger" full>
            {isDeleting ? "กำลังลบ..." : "ลบนัดหมาย"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
