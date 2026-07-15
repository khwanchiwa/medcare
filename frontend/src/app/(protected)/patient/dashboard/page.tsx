"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { TablerIcon, type IconName } from "@/components/ui/tabler-icons";
import {
  listAppointments,
  listMedications,
  type AppointmentRecord,
  type MedicationRecord,
} from "@/features/health/api";
import { ApiError } from "@/lib/api-client";

function SummaryCard({ icon, label, value, tone = "blue" }: { icon: IconName; label: string; value: string; tone?: "blue" | "green" | "red" | "amber" | "teal" }) {
  const toneClass = { blue: "bg-blue-100 text-blue-600", green: "bg-success-100 text-success-600", red: "bg-red-50 text-red-500", amber: "bg-amber-100 text-amber-600", teal: "bg-success-100 text-success-600" }[tone];
  const valueClass = { blue: "text-navy-900", green: "text-success-600", red: "text-red-500", amber: "text-amber-600", teal: "text-success-600" }[tone];
  return (
    <section className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-[0_10px_30px_rgba(20,46,86,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold leading-snug text-slate-500">{label}</p>
          <p className={`mt-2 font-mono text-4xl font-bold ${valueClass}`}>{value}</p>
        </div>
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${toneClass}`}><TablerIcon name={icon} className="h-6 w-6" /></span>
      </div>
    </section>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return <div className="grid h-full min-h-[220px] place-items-center px-6 py-5 text-center text-lg font-semibold text-slate-400">{text}</div>;
}

export default function PatientDashboardPage() {
  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadDashboard = () => {
      Promise.all([listMedications(), listAppointments()])
        .then(([medicationData, appointmentData]) => {
          if (cancelled) return;
          setMedications(medicationData);
          setAppointments(appointmentData);
          setError("");
        })
        .catch((caught) => {
          if (!cancelled) setError(caught instanceof ApiError ? caught.message : "ไม่สามารถโหลดข้อมูล Dashboard ได้");
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    };
    loadDashboard();
    window.addEventListener("focus", loadDashboard);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", loadDashboard);
    };
  }, []);

  const today = useMemo(() => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" }), []);
  const pendingCount = medications.filter((item) => item.is_active).length;
  const takenCount = medications.filter((item) => !item.is_active).length;
  const todayCount = appointments.filter((item) => item.appointment_date === today && item.status !== "cancelled").length;
  const upcomingCount = appointments.filter((item) => item.appointment_date >= today && item.status === "upcoming").length;

  if (isLoading) return <Skeleton label="กำลังโหลดแดชบอร์ด" />;

  return (
    <div className="grid gap-8 lg:gap-10">
      {error ? <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 font-semibold text-red-600" role="alert">{error}</div> : null}

      <section className="overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-navy-900 via-[#19466f] to-[#216fa7] p-6 text-white shadow-[0_18px_50px_rgba(20,46,86,0.16)] md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">ภาพรวมสุขภาพของคุณ</h1>
            <p className="mt-3 text-lg leading-8 text-blue-100">
              ติดตามข้อมูลการใช้ยา การแจ้งเตือน และนัดหมายสำคัญของคุณได้ในที่เดียว
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 md:gap-5 xl:grid-cols-5">
        <SummaryCard icon="pill" label="ยาทั้งหมด" value={String(medications.length)} />
        <SummaryCard icon="bell" label="รอทาน" value={String(pendingCount)} tone="amber" />
        <SummaryCard icon="check" label="ทานแล้ว" value={String(takenCount)} tone="green" />
        <SummaryCard icon="calendar-time" label="นัดหมายวันนี้" value={String(todayCount)} tone="teal" />
        <SummaryCard icon="calendar-time" label="นัดหมายที่ใกล้ถึง" value={String(upcomingCount)} tone="blue" />
      </section>

      <section className="grid gap-8 xl:grid-cols-2">
        <div className="grid min-w-0 grid-rows-[auto_1fr] gap-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-slate-950">รายการยาล่าสุด</h2>
            <Link href="/patient/medications" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 font-semibold text-blue-600 transition hover:bg-blue-100">ดูทั้งหมด<TablerIcon name="arrow-right" className="h-5 w-5" /></Link>
          </div>
          <div className="h-full min-h-[280px] rounded-[24px] border border-blue-100 bg-white/95 shadow-[0_10px_30px_rgba(20,46,86,0.06)]">
            {medications.length ? <div className="grid gap-4 p-6">{medications.slice(0, 3).map((item) => (
              <div key={item.id} className="rounded-2xl bg-blue-100/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-navy-900">{item.name}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-600">{item.dosage} · {item.frequency}</p>
                  </div>
                  <p className="font-mono text-sm font-bold text-blue-600">{item.reminder_times.length ? item.reminder_times.join(", ") : "ยังไม่ตั้งเวลา"}</p>
                </div>
              </div>
            ))}</div> : <EmptyPanel text="ไม่มีข้อมูลยา" />}
          </div>
        </div>

        <div className="grid min-w-0 grid-rows-[auto_1fr] gap-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-slate-950">นัดหมายล่าสุด</h2>
            <Link href="/patient/appointments" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 font-semibold text-blue-600 transition hover:bg-blue-100">ดูทั้งหมด<TablerIcon name="arrow-right" className="h-5 w-5" /></Link>
          </div>
          <div className="h-full min-h-[280px] rounded-[24px] border border-blue-100 bg-white/95 shadow-[0_10px_30px_rgba(20,46,86,0.06)]">
            {appointments.length ? <div className="grid gap-4 p-6">{appointments.slice(0, 3).map((item) => (
              <div key={item.id} className="rounded-2xl bg-blue-100/70 p-4">
                <p className="font-mono text-sm font-bold text-blue-600">{item.appointment_date} · {item.appointment_time.slice(0, 5)}</p>
                <p className="mt-2 text-lg font-bold text-navy-900">{item.title}</p>
                {item.notes ? <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.notes}</p> : null}
              </div>
            ))}</div> : <EmptyPanel text="ไม่มีข้อมูลนัดหมาย" />}
          </div>
        </div>
      </section>
    </div>
  );
}
