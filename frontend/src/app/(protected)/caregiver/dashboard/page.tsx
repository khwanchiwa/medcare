"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TablerIcon } from "@/components/ui/tabler-icons";
import {
  getCaregiverDashboard,
  type CaregiverDashboard,
  type CaregiverPatientSummary,
} from "@/features/caregiver-dashboard/api";

function StatCard({ icon, label, value, tone = "blue" }: { icon: "users" | "pill" | "bell" | "calendar-time"; label: string; value: string; tone?: "blue" | "green" | "amber" }) {
  const tones = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-success-100 text-success-600",
    amber: "bg-amber-100 text-amber-600",
  };

  return (
    <Card className="rounded-[24px] border-blue-100 bg-white/95 p-5 shadow-[0_10px_30px_rgba(20,46,86,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-4xl font-bold text-navy-900">{value}</p>
        </div>
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tones[tone]}`}>
          <TablerIcon name={icon} className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}

function formatNextAppointment(patient: CaregiverPatientSummary) {
  if (!patient.next_appointment) return "ยังไม่มีนัดหมาย";
  const dateText = new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeZone: "Asia/Bangkok",
  }).format(new Date(patient.next_appointment.appointment_date));
  return `${dateText} ${patient.next_appointment.appointment_time.slice(0, 5)}`;
}

function PatientCard({ patient }: { patient: CaregiverPatientSummary }) {
  const hasAlert = patient.missed_dose_alerts > 0;

  return (
    <Card className="overflow-hidden rounded-[24px] border-blue-100 bg-white/95 p-0 shadow-[0_10px_30px_rgba(20,46,86,0.06)]">
      <div className="border-b border-blue-50 bg-gradient-to-r from-blue-50 to-white p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-bold text-navy-900">{patient.name}</h3>
            <Badge tone={hasAlert ? "warning" : "success"}>{hasAlert ? "ต้องติดตาม" : "ปกติ"}</Badge>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-400">{patient.email}</p>
          <p className="mt-3 text-base text-slate-600">{patient.condition}</p>
        </div>

        <Link
          href={`/caregiver/patients/${patient.id}`}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2 font-semibold text-navy-800 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-navy-900 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          ดูข้อมูลผู้ป่วย
          <TablerIcon name="chevron-right" className="h-5 w-5" />
        </Link>
      </div>
      </div>

      <div className="grid gap-3 p-6 sm:grid-cols-4">
        <div className="rounded-2xl bg-blue-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-500">รอทาน</p>
          <p className="mt-1 text-2xl font-bold text-navy-900">{patient.active_medications}</p>
        </div>
        <div className="rounded-2xl bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-500">ทานแล้ว</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{patient.taken_medications}</p>
        </div>
        <div className="rounded-2xl bg-success-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-500">นัดที่กำลังจะถึง</p>
          <p className="mt-1 text-2xl font-bold text-success-600">{patient.upcoming_appointments}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-500">นัดถัดไป</p>
          <p className="mt-1 font-mono text-base font-bold text-navy-900">{formatNextAppointment(patient)}</p>
        </div>
      </div>
    </Card>
  );
}

export default function CaregiverDashboardPage() {
  const [dashboard, setDashboard] = useState<CaregiverDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadDashboard = () => {
      getCaregiverDashboard()
        .then((data) => {
          if (!cancelled) {
            setDashboard(data);
            setError("");
          }
        })
        .catch(() => {
          if (!cancelled) setError("ไม่สามารถโหลดข้อมูลแดชบอร์ดผู้ดูแลได้");
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

  return (
    <>
      {isLoading ? <Skeleton label="กำลังโหลดข้อมูลผู้ดูแล" /> : null}
      {error ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-600">{error}</p> : null}

      {dashboard ? (
        <>
          <section className="overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-navy-900 via-[#19466f] to-[#216fa7] p-6 text-white shadow-[0_18px_50px_rgba(20,46,86,0.16)] md:p-8">
            <div>
              <div className="max-w-3xl">
                <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">แดชบอร์ดผู้ดูแล</h1>
                <p className="mt-3 text-lg leading-8 text-blue-100">
                  ติดตามข้อมูลผู้ป่วยที่อยู่ในความดูแล พร้อมตรวจสอบการใช้ยาและนัดหมายสำคัญ
                </p>
              </div>
            </div>
          </section>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon="users" label="ผู้ป่วยในความดูแล" value={String(dashboard.patient_count)} />
            <StatCard icon="bell" label="รอทาน" value={String(dashboard.active_medications)} tone="amber" />
            <StatCard icon="pill" label="ทานแล้ว" value={String(dashboard.taken_medications)} tone="green" />
            <StatCard icon="calendar-time" label="นัดหมายที่ใกล้ถึง" value={String(dashboard.upcoming_appointments)} />
          </div>

          {dashboard.missed_dose_alerts > 0 ? (
              <Card className="mt-6 rounded-[24px] border-amber-100 bg-amber-50/70 p-5 shadow-[0_10px_30px_rgba(185,121,26,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-navy-900">มีผู้ป่วยที่ต้องติดตาม</h2>
                  <p className="mt-1 text-slate-600">พบรายการพลาดทานยา {dashboard.missed_dose_alerts} รายการจากผู้ป่วยที่คุณดูแล</p>
                </div>
                <Badge tone="warning">ควรตรวจสอบ</Badge>
              </div>
            </Card>
          ) : null}

          <section className="mt-8">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-navy-900">ผู้ป่วยในความดูแล</h2>
                <p className="mt-1 text-slate-600">สรุปข้อมูลการใช้ยา ประวัติการพลาดรับประทานยา และนัดหมาย</p>
              </div>
              <Link href="/caregiver/patients" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 font-semibold text-navy-900 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                ดูทั้งหมด
                <TablerIcon name="arrow-right" className="h-5 w-5" />
              </Link>
            </div>

            {dashboard.patients.length ? (
              <div className="grid gap-4">
                {dashboard.patients.map((patient) => <PatientCard key={patient.id} patient={patient} />)}
              </div>
            ) : (
              <Card className="grid min-h-[180px] place-items-center rounded-[24px] border-blue-100 bg-white/95 p-6 text-center font-semibold text-slate-400 shadow-[0_10px_30px_rgba(20,46,86,0.06)]">
                ยังไม่มีผู้ป่วยที่ผูกกับบัญชีผู้ดูแลนี้
              </Card>
            )}
          </section>
        </>
      ) : null}
    </>
  );
}
