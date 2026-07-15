"use client";

import { use } from "react";

import { AppointmentForm } from "@/components/appointment/AppointmentForm";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/card";
import { TablerIcon } from "@/components/ui/tabler-icons";

export default function NewCaregiverPatientAppointmentPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = use(params);
  const returnTo = `/caregiver/patients/${patientId}/appointments`;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="[&_a]:min-h-10 [&_a]:px-4 [&_a]:py-2 [&_a]:text-sm">
        <Button href={returnTo} icon={<TablerIcon name="arrow-left" />} variant="secondary">กลับไปหน้ารายการนัดหมาย</Button>
      </div>
      <div className="mt-5 [&_h1]:text-3xl [&_p]:text-base">
        <PageTitle title="เพิ่มนัดหมายให้ผู้ป่วย" subtitle="กรอกวัน เวลา และรายละเอียดนัดหมาย" />
      </div>
      <AppointmentForm patientId={patientId} returnTo={returnTo} />
    </div>
  );
}
