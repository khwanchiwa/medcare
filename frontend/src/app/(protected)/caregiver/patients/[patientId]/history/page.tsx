"use client";

import { use, useEffect, useState } from "react";

import { Card, PageTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCaregiverPatient, type CaregiverPatientSummary } from "@/features/caregiver-dashboard/api";
import { listMedicationLogs, listMedicationsForPatient, type MedicationLogRecord } from "@/features/health/api";

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

export default function CaregiverPatientHistoryPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = use(params);
  const [patient, setPatient] = useState<CaregiverPatientSummary | null>(null);
  const [logs, setLogs] = useState<MedicationLogRecord[]>([]);
  const [medicationNames, setMedicationNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getCaregiverPatient(patientId),
      listMedicationLogs(patientId),
      listMedicationsForPatient(patientId),
    ])
      .then(([patientRecord, logRecords, medicationRecords]) => {
        setPatient(patientRecord);
        setLogs(logRecords);
        setMedicationNames(Object.fromEntries(medicationRecords.map((item) => [item.id, item.name])));
      })
      .catch(() => setError("ไม่สามารถโหลดประวัติของผู้ป่วยได้"))
      .finally(() => setIsLoading(false));
  }, [patientId]);

  if (isLoading) return <Skeleton label="กำลังโหลดประวัติ" />;
  if (error || !patient) {
    return <Card className="grid min-h-[160px] place-items-center text-center font-semibold text-slate-400">{error || "ไม่พบข้อมูลผู้ป่วย"}</Card>;
  }

  return (
    <>
      <PageTitle title={`ประวัติของ ${patient.name}`} subtitle="ประวัติการทานยาย้อนหลัง" />
      <Card>
        {logs.length ? logs.map((log) => (
          <p key={log.id} className="border-b border-border py-3 last:border-b-0">
            {medicationNames[log.medication_id] ?? "ไม่ทราบชื่อยา"} · {statusLabel[log.status]} ·{" "}
            <span className="font-mono">{formatDateTime(log.scheduled_at)}</span>
          </p>
        )) : <p className="py-3 text-slate-400">ยังไม่มีประวัติการทานยา</p>}
      </Card>
    </>
  );
}
