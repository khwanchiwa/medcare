import Link from "next/link";

import type { CaregiverPatientSummary } from "@/features/caregiver-dashboard/api";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { TablerIcon } from "../ui/tabler-icons";

function formatNextAppointment(patient: CaregiverPatientSummary) {
  if (!patient.next_appointment) return "ยังไม่มีนัดหมาย";
  const dateText = new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeZone: "Asia/Bangkok",
  }).format(new Date(patient.next_appointment.appointment_date));
  return `${dateText} ${patient.next_appointment.appointment_time.slice(0, 5)}`;
}

export function PatientOverviewGrid({ patients }: { patients: CaregiverPatientSummary[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {patients.map((patient) => {
        const hasAlert = patient.missed_dose_alerts > 0;
        return (
          <Card key={patient.id} className="rounded-[18px] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-bold text-navy-900">{patient.name}</h3>
                  <Badge tone={hasAlert ? "warning" : "success"}>{hasAlert ? "ต้องติดตาม" : "ปกติ"}</Badge>
                </div>
                <p className="mt-1 break-all text-sm font-semibold text-slate-400">{patient.email}</p>
                <p className="mt-3 text-slate-600">{patient.condition}</p>
              </div>

              <Link
                href={`/caregiver/patients/${patient.id}`}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2 font-semibold text-navy-800 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-navy-900 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                ดูข้อมูลผู้ป่วย
                <TablerIcon name="chevron-right" className="h-5 w-5" />
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-blue-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-500">รอทาน</p>
                <p className="mt-1 text-2xl font-bold text-navy-900">{patient.active_medications}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-500">ทานแล้ว</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{patient.taken_medications}</p>
              </div>
              <div className="rounded-2xl bg-success-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-500">นัดถัดไป</p>
                <p className="mt-1 font-mono text-base font-bold text-success-600">{formatNextAppointment(patient)}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
