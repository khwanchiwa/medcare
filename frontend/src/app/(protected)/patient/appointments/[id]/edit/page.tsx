"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

import { AppointmentForm } from "@/components/appointment/AppointmentForm";
import { Card, PageTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TablerIcon } from "@/components/ui/tabler-icons";
import { getAppointment, type AppointmentRecord } from "@/features/health/api";

export default function EditAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [appointment, setAppointment] = useState<AppointmentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAppointment(id)
      .then(setAppointment)
      .catch(() => setError("ไม่พบนัดหมายที่ต้องการแก้ไข"))
      .finally(() => setIsLoading(false));
  }, [id]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link href={`/patient/appointments/${id}`} className="mb-6 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 font-semibold text-blue-600 transition-colors hover:bg-blue-100 hover:text-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        <TablerIcon name="arrow-left" className="h-5 w-5" />
        กลับไปหน้านัดหมาย
      </Link>
      <PageTitle title="แก้ไขนัดหมาย" subtitle={appointment?.title ?? ""} />
      {isLoading ? (
        <Skeleton label="กำลังโหลดข้อมูลนัดหมาย" />
      ) : appointment ? (
        <AppointmentForm appointment={appointment} />
      ) : (
        <Card className="grid min-h-[160px] place-items-center text-center font-semibold text-slate-400">{error}</Card>
      )}
    </div>
  );
}
