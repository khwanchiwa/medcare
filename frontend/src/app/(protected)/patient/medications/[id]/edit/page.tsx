"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

import { MedicationForm } from "@/components/medication/MedicationForm";
import { Card, PageTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TablerIcon } from "@/components/ui/tabler-icons";
import { getMedication, type MedicationRecord } from "@/features/health/api";

export default function EditMedicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [medication, setMedication] = useState<MedicationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMedication(id)
      .then(setMedication)
      .catch(() => setError("ไม่พบรายการยาที่ต้องการแก้ไข"))
      .finally(() => setIsLoading(false));
  }, [id]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link href={`/patient/medications/${id}`} className="mb-6 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 font-semibold text-blue-600 transition-colors hover:bg-blue-100 hover:text-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        <TablerIcon name="arrow-left" className="h-5 w-5" />
        กลับไปหน้ายา
      </Link>
      <PageTitle title="แก้ไขยา" subtitle={medication?.name ?? ""} />
      {isLoading ? (
        <Skeleton label="กำลังโหลดข้อมูลยา" />
      ) : medication ? (
        <MedicationForm mode="edit" medication={medication} />
      ) : (
        <Card className="grid min-h-[160px] place-items-center text-center font-semibold text-slate-400">{error}</Card>
      )}
    </div>
  );
}
