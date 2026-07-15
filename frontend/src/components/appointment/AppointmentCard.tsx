"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { syncAppointmentToGoogle } from "@/features/health/api";
import { getStoredUser } from "@/lib/auth/session";
import type { Appointment } from "@/mocks/mock-appointments";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { TablerIcon } from "../ui/tabler-icons";
import { GoogleCalendarSyncBadge } from "./GoogleCalendarSyncBadge";

export type AppointmentCardData = Omit<Appointment, "googleSync"> & {
  googleSync?: Appointment["googleSync"];
};

function formatThaiDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

export function AppointmentCard({ appointment, showDetails = true, onDelete, actions }: { appointment: AppointmentCardData; showDetails?: boolean; onDelete?: () => Promise<void>; actions?: ReactNode }) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isGoogleSynced, setIsGoogleSynced] = useState(appointment.googleSync === "synced");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");

  async function handleDelete() {
    if (!onDelete) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      await onDelete();
    } catch {
      setDeleteError("ลบนัดหมายไม่สำเร็จ กรุณาลองใหม่");
      setIsDeleting(false);
    }
  }

  async function syncGoogleCalendar() {
    if (isGoogleSynced) return;
    setIsSyncing(true);
    setSyncError("");
    try {
      await syncAppointmentToGoogle(appointment.id);
      setIsGoogleSynced(true);
    } catch {
      setSyncError("ยังบันทึกไม่ได้ กรุณาเชื่อม Google Calendar ก่อน");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <Card className={`h-full rounded-[24px] bg-white/95 p-5 shadow-[0_10px_30px_rgba(20,46,86,0.06)] transition-[border-color,box-shadow] duration-300 hover:shadow-[0_18px_42px_rgba(20,46,86,0.10)] sm:p-6 ${isGoogleSynced ? "border-success-100 hover:border-success-600" : "border-blue-100 hover:border-blue-200"}`}>
      <div className="grid gap-4">
        <div className="flex flex-wrap justify-between gap-3">
          <div className="flex gap-4">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1 ${isGoogleSynced ? "bg-success-100 text-success-600 ring-success-100" : "bg-blue-50 text-blue-600 ring-blue-100"}`}>
              <TablerIcon name="calendar-time" className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-xl font-bold text-navy-900">{appointment.title}</h3>
              <p className="mt-1 text-slate-600">{appointment.notes}</p>
            </div>
          </div>
          {isGoogleSynced ? <GoogleCalendarSyncBadge status="synced" /> : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
            <p className="text-xs font-semibold text-slate-500">วันที่นัดหมาย</p>
            <p className="mt-1 text-base font-bold text-navy-900">{formatThaiDate(appointment.date)}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
            <p className="text-xs font-semibold text-slate-500">เวลา</p>
            <p className="mt-1 text-base font-bold text-navy-900">{appointment.time} น.</p>
          </div>
        </div>
        <div className={`grid gap-2 [&_a]:min-h-10 [&_a]:px-3 [&_a]:py-2 [&_a]:text-sm [&_button]:min-h-10 [&_button]:px-3 [&_button]:py-2 [&_button]:text-sm ${onDelete && showDetails ? "sm:grid-cols-3" : onDelete || showDetails ? "sm:grid-cols-2" : ""}`}>
          {showDetails ? <Button href={`/patient/appointments/${appointment.id}`} icon={<TablerIcon name="chevron-right" />} variant="ghost" full>ดูรายละเอียดนัดหมาย</Button> : null}
          <Button disabled={isGoogleSynced || isSyncing} icon={<TablerIcon name={isGoogleSynced ? "check" : "calendar-time"} />} onClick={syncGoogleCalendar} variant={isGoogleSynced ? "success" : "secondary"} full>
            {isGoogleSynced ? "บันทึกใน Google Calendar แล้ว" : isSyncing ? "กำลังบันทึก..." : "เพิ่มลง Google Calendar"}
          </Button>
          {onDelete && !isConfirmingDelete ? <Button icon={<TablerIcon name="trash" />} onClick={() => setIsConfirmingDelete(true)} variant="danger" full>ลบนัดหมาย</Button> : null}
        </div>
        {syncError ? (
          <div className="flex flex-col gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 sm:flex-row sm:items-center sm:justify-between" role="alert">
            <p>{getStoredUser()?.role === "CAREGIVER" ? "ผู้ป่วยต้องเชื่อม Google Calendar ก่อนจึงจะบันทึกนัดหมายได้" : syncError}</p>
            {getStoredUser()?.role !== "CAREGIVER" ? (
              <div className="shrink-0 [&_a]:min-h-9 [&_a]:px-3 [&_a]:py-1.5 [&_a]:text-sm">
                <Button href="/patient/integrations" icon={<TablerIcon name="link" />} variant="secondary">ไปหน้าเชื่อมต่อ</Button>
              </div>
            ) : null}
          </div>
        ) : null}
        {actions ? <div className="grid gap-2 border-t border-blue-100 pt-4 sm:grid-cols-2">{actions}</div> : null}
        {isConfirmingDelete ? <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="font-semibold text-red-700">ยืนยันลบ “{appointment.title}” หรือไม่?</p>
          <p className="mt-1 text-sm text-red-600">ข้อมูลที่ลบแล้วจะไม่สามารถเรียกคืนได้</p>
          {deleteError ? <p className="mt-2 text-sm font-semibold text-red-700" role="alert">{deleteError}</p> : null}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Button disabled={isDeleting} icon={<TablerIcon name="x" />} onClick={() => setIsConfirmingDelete(false)} variant="secondary" full>ยกเลิก</Button>
            <Button disabled={isDeleting} icon={<TablerIcon name="trash" />} onClick={handleDelete} variant="danger" full>{isDeleting ? "กำลังลบ..." : "ยืนยันลบ"}</Button>
          </div>
        </div> : null}
      </div>
    </Card>
  );
}
