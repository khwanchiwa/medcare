"use client";

import { useCallback, useEffect, useState } from "react";

import { MedicationCard, type MedicationCardData } from "@/components/medication/MedicationCard";
import { Button } from "@/components/ui/button";
import { Card, PageTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TablerIcon } from "@/components/ui/tabler-icons";
import { getCaregiverPatient, type CaregiverPatientSummary } from "@/features/caregiver-dashboard/api";
import { deleteMedication, listMedicationsForPatient, markMedicationTaken, type MedicationRecord } from "@/features/health/api";

export default function CaregiverPatientMedicationsPage({ params }: { params: Promise<{ patientId: string }> }) {
  const [patient, setPatient] = useState<CaregiverPatientSummary | null>(null);
  const [medications, setMedications] = useState<MedicationCardData[]>([]);
  const [patientId, setPatientId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  function toCard(item: MedicationRecord): MedicationCardData {
    return {
      id: item.id,
      patientId: item.patient_id,
      name: item.name,
      dosage: item.dosage,
      frequency: item.frequency,
      times: item.reminder_times,
      instructions: item.instructions ?? "ไม่มีคำแนะนำเพิ่มเติม",
      status: item.is_active ? "pending" : "taken",
    };
  }

  const loadData = useCallback(async (id: string) => {
    const [patientRecord, medicationRecords] = await Promise.all([
      getCaregiverPatient(id),
      listMedicationsForPatient(id),
    ]);
    setPatient(patientRecord);
    setMedications(medicationRecords.map(toCard));
  }, []);

  useEffect(() => {
    params
      .then(async ({ patientId }) => {
        setPatientId(patientId);
        await loadData(patientId);
      })
      .catch(() => setError("ไม่สามารถโหลดรายการยาของผู้ป่วยได้"))
      .finally(() => setIsLoading(false));
  }, [loadData, params]);

  async function handleDelete(id: string) {
    setError("");
    try {
      await deleteMedication(id);
      if (patientId) await loadData(patientId);
    } catch {
      setError("ไม่สามารถลบรายการยาได้");
    }
  }

  async function handleTaken(id: string) {
    setError("");
    try {
      await markMedicationTaken(id);
      setMedications((current) => current.map((item) => item.id === id ? { ...item, status: "taken" } : item));
    } catch {
      setError("ไม่สามารถบันทึกการทานยาได้");
      throw new Error("Medication check-in failed");
    }
  }

  if (isLoading) return <Skeleton label="กำลังโหลดรายการยา" />;
  if (error) return <Card className="grid min-h-[160px] place-items-center text-center font-semibold text-slate-400">{error}</Card>;

  return (
    <>
      <div className="mb-5">
        <Button href={`/caregiver/patients/${patientId}`} icon={<TablerIcon name="arrow-left" />} variant="secondary">กลับไปหน้าข้อมูลผู้ป่วย</Button>
      </div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <PageTitle title={`ยาของ ${patient?.name ?? "ผู้ป่วย"}`} subtitle="ผู้ดูแลสามารถเพิ่ม แก้ไข และลบรายการยาของผู้ป่วยที่ผูกไว้ได้" />
        <Button href={`/caregiver/patients/${patientId}/medications/new`} icon={<TablerIcon name="plus" />}>เพิ่มยาใหม่</Button>
      </div>

      {medications.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {medications.map((medication) => (
            <div key={medication.id} className="overflow-hidden rounded-[24px] border border-blue-100 bg-white/95 p-3 shadow-[0_10px_30px_rgba(20,46,86,0.05)]">
              <MedicationCard medication={medication} showDetails={false} onTaken={() => handleTaken(medication.id)} />
              <div className="mt-3 grid gap-2 border-t border-blue-100 pt-3 sm:grid-cols-2">
                <Button href={`/caregiver/patients/${patientId}/medications/${medication.id}/edit`} icon={<TablerIcon name="edit" />} variant="secondary">แก้ไขยา</Button>
                <Button icon={<TablerIcon name="trash" />} onClick={() => handleDelete(medication.id)} variant="danger">ลบยา</Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="grid min-h-[160px] place-items-center text-center font-semibold text-slate-400">ยังไม่มีรายการยา</Card>
      )}
    </>
  );
}
