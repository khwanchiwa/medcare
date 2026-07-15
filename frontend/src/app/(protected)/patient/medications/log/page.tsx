"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, PageTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listMedicationLogs, listMedications, type MedicationLogRecord } from "@/features/health/api";

const statusLabel: Record<MedicationLogRecord["status"], string> = {
  taken: "ทานแล้ว",
  pending: "รอทาน",
  missed: "พลาด",
};

const statusTone: Record<MedicationLogRecord["status"], "success" | "warning" | "info"> = {
  taken: "success",
  pending: "info",
  missed: "warning",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

export default function MedicationLogPage() {
  const [logs, setLogs] = useState<MedicationLogRecord[]>([]);
  const [medicationNames, setMedicationNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([listMedicationLogs(), listMedications()])
      .then(([logRecords, medicationRecords]) => {
        setLogs(logRecords);
        setMedicationNames(Object.fromEntries(medicationRecords.map((item) => [item.id, item.name])));
      })
      .catch(() => setError("ไม่สามารถโหลดประวัติการทานยาได้"))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <>
      <PageTitle title="ประวัติการทานยา" subtitle="ตารางย้อนหลังพร้อมสถานะทานยา" />
      {isLoading ? <Skeleton label="กำลังโหลดประวัติการทานยา" /> : null}
      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-600">{error}</p> : null}
      {!isLoading && !error && !logs.length ? (
        <Card className="grid min-h-[160px] place-items-center text-center font-semibold text-slate-400">ยังไม่มีประวัติการทานยา</Card>
      ) : null}
      {!isLoading && !error && logs.length ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead className="text-slate-600">
                <tr>
                  <th className="p-3">ยา</th>
                  <th className="p-3">เวลาที่กำหนด</th>
                  <th className="p-3">เวลาที่ทาน</th>
                  <th className="p-3">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-border">
                    <td className="p-3 font-semibold">{medicationNames[log.medication_id] ?? "ไม่ทราบชื่อยา"}</td>
                    <td className="p-3 font-mono">{formatDateTime(log.scheduled_at)}</td>
                    <td className="p-3 font-mono">{log.taken_at ? formatDateTime(log.taken_at) : "ยังไม่บันทึก"}</td>
                    <td className="p-3"><Badge tone={statusTone[log.status]}>{statusLabel[log.status]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </>
  );
}
