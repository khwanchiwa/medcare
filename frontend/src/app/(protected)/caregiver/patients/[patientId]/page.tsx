"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TablerIcon } from "@/components/ui/tabler-icons";
import { getCaregiverPatient, type CaregiverPatientSummary } from "@/features/caregiver-dashboard/api";

function formatNextAppointment(patient: CaregiverPatientSummary) {
  if (!patient.next_appointment) return "ยังไม่มีนัดหมาย";
  const dateText = new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeZone: "Asia/Bangkok",
  }).format(new Date(patient.next_appointment.appointment_date));
  return `${patient.next_appointment.title} · ${dateText} ${patient.next_appointment.appointment_time.slice(0, 5)}`;
}

export default function CaregiverPatientOverviewPage({ params }: { params: Promise<{ patientId: string }> }) {
  const [patientId, setPatientId] = useState("");
  const [patient, setPatient] = useState<CaregiverPatientSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    params
      .then(({ patientId: id }) => {
        setPatientId(id);
        return getCaregiverPatient(id);
      })
      .then((record) => {
        if (!record) {
          setError("ไม่พบผู้ป่วยที่ผูกกับบัญชีผู้ดูแลนี้");
          return;
        }
        setPatient(record);
      })
      .catch(() => setError("ไม่สามารถโหลดข้อมูลผู้ป่วยได้"))
      .finally(() => setIsLoading(false));
  }, [params]);

  if (isLoading) return <Skeleton label="กำลังโหลดข้อมูลผู้ป่วย" />;
  if (error || !patient) {
    return <Card className="grid min-h-[180px] place-items-center text-center font-semibold text-slate-400">{error}</Card>;
  }

  return (
    <div className="grid gap-6">
      <div>
        <Button href="/caregiver/patients" icon={<TablerIcon name="arrow-left" />} variant="secondary">กลับไปหน้าผู้ป่วย</Button>
      </div>

      <section className="overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-navy-900 via-[#19466f] to-[#216fa7] p-6 text-white shadow-[0_18px_50px_rgba(20,46,86,0.16)] md:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-5">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl font-bold ring-1 ring-white/20 backdrop-blur">
              {patient.name.trim().charAt(0).toUpperCase() || "P"}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-blue-100">ข้อมูลผู้ป่วย</p>
              <h1 className="mt-1 truncate text-3xl font-bold md:text-4xl">{patient.name}</h1>
              <p className="mt-2 break-all text-blue-100">{patient.email}</p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold ring-1 ring-white/20">
            <TablerIcon name="link" className="h-5 w-5" /> เชื่อมต่อแล้ว
          </span>
        </div>
      </section>

      <div className="grid items-stretch gap-5 lg:grid-cols-2">
        <Card className="flex h-full flex-col overflow-hidden rounded-[24px] border-blue-100 bg-white/95 p-0 shadow-[0_10px_30px_rgba(20,46,86,0.06)]">
          <div className="flex items-center gap-4 border-b border-blue-100 bg-blue-50/60 p-5 sm:p-6">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm">
              <TablerIcon name="pill" className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-navy-900">การทานยา</h2>
              <p className="mt-1 text-sm text-slate-500">ติดตามรายการยาของผู้ป่วย</p>
            </div>
          </div>
          <div className="grid flex-1 gap-3 p-5 sm:grid-cols-2 sm:p-6">
            <div className="rounded-2xl border border-blue-100 bg-white p-4">
              <p className="text-sm font-semibold text-slate-500">รอทาน</p>
              <p className="mt-2 text-3xl font-bold text-blue-700">{patient.active_medications}</p>
              <p className="mt-1 text-sm text-slate-500">รายการที่ยังรอบันทึก</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <p className="text-sm font-semibold text-slate-500">ทานแล้ว</p>
              <p className="mt-2 text-3xl font-bold text-emerald-700">{patient.taken_medications}</p>
              <p className="mt-1 text-sm text-slate-500">รายการที่บันทึกแล้ว</p>
            </div>
          </div>
          <div className="border-t border-blue-100 p-5 sm:p-6">
            <Button href={`/caregiver/patients/${patientId}/medications`} icon={<TablerIcon name="pill" />} full>ดูรายการยาทั้งหมด</Button>
          </div>
        </Card>

        <Card className="flex h-full flex-col overflow-hidden rounded-[24px] border-blue-100 bg-white/95 p-0 shadow-[0_10px_30px_rgba(20,46,86,0.06)]">
          <div className="flex items-center gap-4 border-b border-blue-100 bg-sky-50/70 p-5 sm:p-6">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-sky-700 shadow-sm">
              <TablerIcon name="calendar-time" className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-navy-900">การนัดหมาย</h2>
              <p className="mt-1 text-sm text-slate-500">ตรวจสอบวันและเวลานัดหมาย</p>
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-center p-5 sm:p-6">
            <p className="text-sm font-semibold text-slate-500">นัดหมายถัดไป</p>
            <p className="mt-3 text-xl font-bold leading-8 text-navy-900">{formatNextAppointment(patient)}</p>
          </div>
          <div className="border-t border-blue-100 p-5 sm:p-6">
            <Button href={`/caregiver/patients/${patientId}/appointments`} icon={<TablerIcon name="calendar-time" />} full>ดูนัดหมายทั้งหมด</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
