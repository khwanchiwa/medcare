"use client";

import { use, useEffect, useState } from "react";

import { MedicationForm } from "@/components/medication/MedicationForm";
import { Button } from "@/components/ui/button";
import { Card, PageTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TablerIcon } from "@/components/ui/tabler-icons";
import { listMedicationsForPatient } from "@/features/health/api";
import type { Medication } from "@/mocks/mock-medications";

export default function EditCaregiverPatientMedicationPage({ params }: { params: Promise<{ patientId: string; medicationId: string }> }) {
  const { patientId, medicationId } = use(params);
  const returnTo = `/caregiver/patients/${patientId}/medications`;
  const [medication, setMedication] = useState<Medication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listMedicationsForPatient(patientId)
      .then((items) => {
        const item = items.find((record) => record.id === medicationId);
        if (!item) {
          setError("ไม่พบรายการยาที่ต้องการแก้ไข");
          return;
        }
        setMedication({
          id: item.id,
          patientId: item.patient_id,
          name: item.name,
          dosage: item.dosage,
          frequency: item.frequency,
          times: item.reminder_times,
          instructions: item.instructions ?? "",
          status: "pending",
          nextDose: item.reminder_times[0] ?? "ยังไม่ระบุ",
        });
      })
      .catch(() => setError("ไม่สามารถโหลดข้อมูลยาได้"))
      .finally(() => setIsLoading(false));
  }, [medicationId, patientId]);

  if (isLoading) return <Skeleton label="กำลังโหลดข้อมูลยา" />;

  return (
    <>
      <Button href={returnTo} icon={<TablerIcon name="arrow-left" />} variant="secondary">กลับไปหน้ารายการยา</Button>
      <div className="mt-7">
        <PageTitle title="แก้ไขข้อมูลยา" subtitle="แก้ไขรายละเอียดและเวลาแจ้งเตือนของผู้ป่วย" />
      </div>
      {error || !medication ? (
        <Card className="grid min-h-[160px] place-items-center text-center font-semibold text-slate-400">{error}</Card>
      ) : (
        <MedicationForm mode="edit" medication={medication} patientId={patientId} returnTo={returnTo} />
      )}
    </>
  );
}
