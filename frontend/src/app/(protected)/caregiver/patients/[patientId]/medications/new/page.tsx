"use client";

import { use, useState } from "react";

import { MedicationForm } from "@/components/medication/MedicationForm";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/card";
import { TablerIcon } from "@/components/ui/tabler-icons";

export default function NewCaregiverPatientMedicationPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = use(params);
  const [returnTo] = useState(`/caregiver/patients/${patientId}/medications`);

  return (
    <>
      <Button href={returnTo} icon={<TablerIcon name="arrow-left" />} variant="secondary">กลับไปหน้ารายการยา</Button>
      <div className="mt-7">
        <PageTitle title="เพิ่มยาให้ผู้ป่วย" subtitle="กรอกข้อมูลยาและเวลาแจ้งเตือนให้ครบถ้วน" />
      </div>
      <MedicationForm mode="view" patientId={patientId} returnTo={returnTo} />
    </>
  );
}
