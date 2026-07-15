"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, PageTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TablerIcon } from "@/components/ui/tabler-icons";
import { deleteMedication, listMedications, type MedicationRecord } from "@/features/health/api";

export default function MedicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [medication, setMedication] = useState<MedicationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listMedications()
      .then((items) => {
        const item = items.find((record) => record.id === id);
        if (item) setMedication(item);
        else setError("ไม่พบรายการยานี้");
      })
      .catch(() => setError("ไม่สามารถโหลดข้อมูลยาได้"))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleDelete() {
    setIsDeleting(true);
    setError("");
    try {
      await deleteMedication(id);
      router.push("/patient/medications");
      router.refresh();
    } catch {
      setError("ไม่สามารถลบรายการยาได้ กรุณาลองใหม่");
      setIsDeleting(false);
    }
  }

  if (isLoading) return <Skeleton label="กำลังโหลดข้อมูลยา" />;
  if (!medication) return <Card className="grid min-h-[180px] place-items-center text-center font-semibold text-slate-400">{error}</Card>;

  const takenIds = new Set<string>(JSON.parse(localStorage.getItem("medcare_taken_medications") || "[]"));
  const isTaken = takenIds.has(medication.id) || !medication.is_active;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5">
      <div>
        <Button href="/patient/medications" icon={<TablerIcon name="arrow-left" />} variant="secondary">กลับไปหน้ารายการยา</Button>
      </div>

      <PageTitle title="รายละเอียดยา" subtitle="ตรวจสอบข้อมูลการใช้ยาและเวลาแจ้งเตือน" />

      <Card className="overflow-hidden rounded-[24px] border-blue-100 bg-white/95 p-0 shadow-[0_12px_34px_rgba(20,46,86,0.07)]">
        <div className="flex flex-col gap-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-white p-5 sm:flex-row sm:items-center sm:justify-between md:px-6 md:py-5">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
              <TablerIcon name="pill" className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-navy-900 sm:text-2xl">{medication.name}</h1>
              <p className="mt-1 text-slate-600">{medication.dosage} · {medication.frequency}</p>
            </div>
          </div>
          <Badge tone={isTaken ? "success" : "warning"}>{isTaken ? "ทานแล้ว" : "รอทาน"}</Badge>
        </div>

        <div className="grid gap-3 p-5 md:grid-cols-2 md:p-6">
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-sm font-semibold text-slate-500">จำนวนที่ทานต่อครั้ง</p>
            <p className="mt-1.5 text-base font-bold text-navy-900">{medication.quantity || "ยังไม่ระบุ"}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-sm font-semibold text-slate-500">เวลาแจ้งเตือน</p>
            <p className="mt-1.5 text-base font-bold text-navy-900">{medication.reminder_times.length ? medication.reminder_times.join(", ") : "ยังไม่ตั้งเวลา"}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-white p-4 md:col-span-2">
            <p className="text-sm font-semibold text-slate-500">คำแนะนำ</p>
            <p className="mt-1.5 text-base font-semibold text-navy-900">{medication.instructions || "ไม่มีคำแนะนำเพิ่มเติม"}</p>
          </div>
        </div>

        {error ? <p className="mx-6 mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 md:mx-8" role="alert">{error}</p> : null}
        <div className="grid gap-3 border-t border-blue-100 bg-slate-50/70 p-4 sm:grid-cols-2 md:px-6">
          <Button href={`/patient/medications/${medication.id}/edit`} icon={<TablerIcon name="edit" />} full>แก้ไขยา</Button>
          <Button disabled={isDeleting} icon={<TablerIcon name="trash" />} onClick={handleDelete} variant="danger" full>
            {isDeleting ? "กำลังลบ..." : "ลบยา"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
