"use client";

import { useEffect, useState } from "react";

import { Card, PageTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  listAppointments,
  listMedicationLogs,
  listMedications,
  type AppointmentRecord,
  type MedicationLogRecord,
} from "@/features/health/api";

const statusLabel: Record<MedicationLogRecord["status"], string> = {
  taken: "ทานแล้ว",
  pending: "รอทาน",
  missed: "พลาด",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "long", timeZone: "Asia/Bangkok" }).format(
    new Date(`${value}T00:00:00+07:00`),
  );
}

export default function PatientHistoryPage() {
  const [logs, setLogs] = useState<MedicationLogRecord[]>([]);
  const [medicationNames, setMedicationNames] = useState<Record<string, string>>({});
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [logsError, setLogsError] = useState("");
  const [appointmentsError, setAppointmentsError] = useState("");

  useEffect(() => {
    Promise.all([listMedicationLogs(), listMedications()])
      .then(([logRecords, medicationRecords]) => {
        setLogs(logRecords);
        setMedicationNames(Object.fromEntries(medicationRecords.map((item) => [item.id, item.name])));
      })
      .catch(() => setLogsError("ไม่สามารถโหลดประวัติการทานยาได้"))
      .finally(() => setIsLoadingLogs(false));

    listAppointments()
      .then(setAppointments)
      .catch(() => setAppointmentsError("ไม่สามารถโหลดประวัตินัดหมายได้"))
      .finally(() => setIsLoadingAppointments(false));
  }, []);

  return (
    <>
      <PageTitle title="ประวัติรวม" subtitle="รวมประวัติยาและนัดหมายย้อนหลัง" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-serifThai text-2xl font-semibold text-navy-900">ยา</h2>
          {isLoadingLogs ? <Skeleton label="กำลังโหลดประวัติการทานยา" /> : null}
          {!isLoadingLogs && logsError ? <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-600">{logsError}</p> : null}
          {!isLoadingLogs && !logsError && !logs.length ? <p className="mt-3 text-slate-400">ยังไม่มีประวัติการทานยา</p> : null}
          {!isLoadingLogs && !logsError ? logs.map((log) => (
            <p key={log.id} className="mt-3 border-t border-border pt-3">
              {medicationNames[log.medication_id] ?? "ไม่ทราบชื่อยา"} · {statusLabel[log.status]} ·{" "}
              <span className="font-mono">{formatDateTime(log.scheduled_at)}</span>
            </p>
          )) : null}
        </Card>
        <Card>
          <h2 className="font-serifThai text-2xl font-semibold text-navy-900">นัดหมาย</h2>
          {isLoadingAppointments ? <Skeleton label="กำลังโหลดประวัตินัดหมาย" /> : null}
          {!isLoadingAppointments && appointmentsError ? <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-600">{appointmentsError}</p> : null}
          {!isLoadingAppointments && !appointmentsError && !appointments.length ? <p className="mt-3 text-slate-400">ยังไม่มีนัดหมาย</p> : null}
          {!isLoadingAppointments && !appointmentsError ? appointments.map((appt) => (
            <p key={appt.id} className="mt-3 border-t border-border pt-3">
              {appt.title} ·{" "}
              <span className="font-mono">{formatDate(appt.appointment_date)} {appt.appointment_time.slice(0, 5)}</span>
            </p>
          )) : null}
        </Card>
      </div>
    </>
  );
}
