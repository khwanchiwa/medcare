"use client";

import { useState } from "react";

import type { Medication } from "@/mocks/mock-medications";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { TablerIcon } from "../ui/tabler-icons";
import { MedicationCheckIn } from "./MedicationCheckIn";

export type MedicationCardData = Omit<Medication, "status" | "nextDose"> & {
  status?: Medication["status"];
  nextDose?: string;
};

function medicationStatusLabel(status: Medication["status"]) {
  if (status === "taken") return "ทานแล้ว";
  if (status === "missed") return "พลาด";
  return "รอทาน";
}

export function MedicationCard({ medication, showAction = true, showDetails = true, onDelete, onTaken }: { medication: MedicationCardData; showAction?: boolean; showDetails?: boolean; onDelete?: () => Promise<void>; onTaken?: () => Promise<void> }) {
  const tone = medication.status === "taken" ? "success" : medication.status === "missed" ? "warning" : "info";
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleDelete() {
    if (!onDelete) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      await onDelete();
    } catch {
      setDeleteError("ลบรายการยาไม่สำเร็จ กรุณาลองใหม่");
      setIsDeleting(false);
    }
  }
  return (
    <Card className="overflow-hidden rounded-[24px] border-blue-100 bg-white/95 p-5 shadow-[0_10px_30px_rgba(20,46,86,0.06)] transition-[border-color,box-shadow] duration-300 hover:border-blue-200 hover:shadow-[0_18px_42px_rgba(20,46,86,0.10)] sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <TablerIcon name="pill" className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-xl font-bold text-navy-900">{medication.name}</h3>
              <p className="mt-1 text-base text-slate-600">{medication.dosage} · {medication.frequency}</p>
            </div>
          </div>
          {medication.status ? <Badge tone={tone}>{medicationStatusLabel(medication.status)}</Badge> : null}
        </div>

        <div className="grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
          <p className="text-base font-semibold text-slate-800">{medication.instructions}</p>
          <p className="font-mono text-sm font-semibold text-slate-600">เวลาแจ้งเตือน: {medication.times.join(", ")}</p>
        </div>

        {showAction || showDetails || onDelete ? (
          <div className={`mt-auto grid grid-cols-1 gap-3 ${showAction && medication.status !== "taken" && onDelete ? "sm:grid-cols-3" : [showAction && medication.status !== "taken", showDetails, Boolean(onDelete)].filter(Boolean).length > 1 ? "sm:grid-cols-2" : ""}`}>
            {showAction && medication.status !== "taken" ? <MedicationCheckIn medicationName={medication.name} onTaken={onTaken} /> : null}
            {showDetails ? <Button href={`/patient/medications/${medication.id}`} icon={<TablerIcon name="chevron-right" />} variant="ghost" full>ดูรายละเอียด</Button> : null}
            {onDelete && !isConfirmingDelete ? <Button icon={<TablerIcon name="trash" />} onClick={() => setIsConfirmingDelete(true)} variant="danger" full>ลบรายการ</Button> : null}
          </div>
        ) : null}
        {isConfirmingDelete ? <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="font-semibold text-red-700">ยืนยันลบ “{medication.name}” หรือไม่?</p>
          <p className="mt-1 text-sm text-red-600">ข้อมูลที่ลบแล้วจะไม่สามารถเรียกคืนได้</p>
          {deleteError ? <p className="mt-2 text-sm font-semibold text-red-700" role="alert">{deleteError}</p> : null}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Button disabled={isDeleting} icon={<TablerIcon name="x" />} onClick={() => setIsConfirmingDelete(false)} variant="secondary" full>ยกเลิก</Button>
            <Button disabled={isDeleting} icon={<TablerIcon name="trash" />} onClick={handleDelete} variant="danger" full>{isDeleting ? "กำลังลบ..." : "ยืนยันลบ"}</Button>
          </div>
        </div> : null}
      </div>
    </Card>
  );
}
