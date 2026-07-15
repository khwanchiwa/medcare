"use client";

import { useEffect, useState } from "react";

import { AppointmentCard, type AppointmentCardData } from "@/components/appointment/AppointmentCard";
import { Button } from "@/components/ui/button";
import { Card, PageTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TablerIcon } from "@/components/ui/tabler-icons";
import { deleteAppointment, listAppointments } from "@/features/health/api";

type AppointmentFilter = "all" | "upcoming" | "past";

const appointmentFilters: { id: AppointmentFilter; label: string; mobileLabel: string }[] = [
  { id: "all", label: "นัดหมายทั้งหมด", mobileLabel: "ทั้งหมด" },
  { id: "upcoming", label: "นัดที่ใกล้มาถึง", mobileLabel: "ใกล้มาถึง" },
  { id: "past", label: "นัดที่ผ่านมา", mobileLabel: "ที่ผ่านมา" },
];

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-5 grid min-h-[180px] place-items-center rounded-[24px] border border-blue-100 bg-white/90 px-6 py-10 text-center shadow-[0_12px_30px_rgba(20,46,86,0.06)]">
      <div>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          <TablerIcon name="calendar-time" className="h-7 w-7" />
        </span>
        <p className="mt-4 text-base font-semibold text-slate-500">{text}</p>
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<AppointmentFilter>("all");

  useEffect(() => {
    listAppointments()
      .then((records) => setAppointments(records.map((item) => ({
        id: item.id,
        patientId: item.patient_id,
        title: item.title,
        date: item.appointment_date,
        time: item.appointment_time.slice(0, 5),
        notes: item.notes ?? "ไม่มีข้อปฏิบัติเพิ่มเติม",
        status: item.status === "completed" ? "completed" : "upcoming",
        googleSync: item.google_event_id ? "synced" : "pending",
      }))))
      .catch(() => setError("ไม่สามารถโหลดนัดหมายได้"))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleDelete(id: string) {
    await deleteAppointment(id);
    setAppointments((current) => current.filter((item) => item.id !== id));
  }

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" });
  const filteredAppointments = appointments.filter((item) => {
    if (activeFilter === "upcoming") return item.status === "upcoming" && item.date >= today;
    if (activeFilter === "past") return item.status === "completed" || item.date < today;
    return true;
  });
  const emptyText = activeFilter === "upcoming"
    ? "ยังไม่มีนัดที่ใกล้มาถึง"
    : activeFilter === "past"
      ? "ยังไม่มีนัดที่ผ่านมา"
      : "ยังไม่มีนัดหมาย";
  const activeFilterIndex = appointmentFilters.findIndex((filter) => filter.id === activeFilter);

  return <>
    <Card className="mb-6 overflow-hidden rounded-[28px] border-blue-100 bg-gradient-to-br from-white via-blue-50/70 to-sky-50 p-5 shadow-[0_16px_42px_rgba(20,46,86,0.08)] sm:p-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <PageTitle title="นัดหมาย" subtitle="ดูรายละเอียดนัดหมายที่บันทึกไว้ และซิงค์กับ Google Calendar" />
          <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold text-slate-600">
            <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">ทั้งหมด {appointments.length}</span>
          </div>
        </div>
        <div className="grid max-w-[310px] grid-cols-2 gap-2 sm:w-[360px] sm:max-w-none sm:self-start sm:gap-3">
        <div className="[&_a]:min-h-9 [&_a]:rounded-2xl [&_a]:px-2 [&_a]:py-1.5 [&_a]:text-xs [&_svg]:h-4 [&_svg]:w-4 sm:[&_a]:min-h-11 sm:[&_a]:px-5 sm:[&_a]:py-3 sm:[&_a]:text-base sm:[&_svg]:h-5 sm:[&_svg]:w-5">
          <Button href="/patient/appointments/scan" icon={<TablerIcon name="scan" />} variant="secondary" full>สแกนใบนัด</Button>
        </div>
        <div className="[&_a]:min-h-9 [&_a]:rounded-2xl [&_a]:px-2 [&_a]:py-1.5 [&_a]:text-xs [&_svg]:h-4 [&_svg]:w-4 sm:[&_a]:min-h-11 sm:[&_a]:px-5 sm:[&_a]:py-3 sm:[&_a]:text-base sm:[&_svg]:h-5 sm:[&_svg]:w-5">
          <Button href="/patient/appointments/new" icon={<TablerIcon name="plus" />} full>สร้างนัดหมาย</Button>
        </div>
      </div>
      </div>
    </Card>
    <div className="relative mb-6 grid grid-cols-3 rounded-[22px] border border-blue-100 bg-white/90 p-1.5 shadow-[0_8px_24px_rgba(20,46,86,0.06)] backdrop-blur">
      <span
        aria-hidden="true"
        className="absolute bottom-1.5 left-1.5 top-1.5 w-[calc(33.333333%_-_0.25rem)] rounded-[17px] bg-blue-600 shadow-[0_8px_18px_rgba(43,95,206,0.22)] transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${activeFilterIndex * 100}%)` }}
      />
      {appointmentFilters.map((filter) => {
        const isActive = activeFilter === filter.id;
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => setActiveFilter(filter.id)}
            className={`relative z-10 min-h-11 min-w-0 rounded-[17px] px-2 text-sm font-semibold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:min-h-12 sm:px-5 sm:text-base ${
              isActive ? "text-white" : "text-slate-500 hover:text-navy-900"
            }`}
          >
            <span className="sm:hidden">{filter.mobileLabel}</span>
            <span className="hidden truncate sm:block">{filter.label}</span>
          </button>
        );
      })}
    </div>
    {isLoading ? <Skeleton label="กำลังโหลดนัดหมาย" /> : null}
    {error ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-600">{error}</p> : null}
    {!isLoading && !error && !filteredAppointments.length ? <EmptyState text={emptyText} /> : null}
    <div className="mt-5 grid gap-4 lg:grid-cols-2">{filteredAppointments.map((item) => <AppointmentCard key={item.id} appointment={item} onDelete={() => handleDelete(item.id)} />)}</div>
  </>;
}
