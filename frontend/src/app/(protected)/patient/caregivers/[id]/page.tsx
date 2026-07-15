"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, PageTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TablerIcon } from "@/components/ui/tabler-icons";
import { listCaregiverRelationships, revokeCaregiverRelationship } from "@/features/caregiver-relationship/api";
import type { CaregiverRelationship } from "@/features/caregiver-relationship/types";

export default function CaregiverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [relationship, setRelationship] = useState<CaregiverRelationship | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    params
      .then(({ id }) => listCaregiverRelationships().then((items) => items.find((item) => item.id === id) ?? null))
      .then((item) => {
        if (!item) {
          setError("ไม่พบผู้ดูแลที่ผูกไว้");
          return;
        }
        setRelationship(item);
      })
      .catch(() => setError("ไม่สามารถโหลดข้อมูลผู้ดูแลได้"))
      .finally(() => setIsLoading(false));
  }, [params]);

  async function handleRevoke() {
    if (!relationship) return;
    setIsRevoking(true);
    setError("");
    try {
      await revokeCaregiverRelationship(relationship.id);
      router.push("/patient/caregivers");
      router.refresh();
    } catch {
      setError("ไม่สามารถยกเลิกสิทธิ์ผู้ดูแลได้ กรุณาลองใหม่");
      setIsRevoking(false);
    }
  }

  if (isLoading) return <Skeleton label="กำลังโหลดสิทธิ์ผู้ดูแล" />;
  if (error || !relationship) {
    return <Card className="grid min-h-[180px] place-items-center text-center font-semibold text-slate-400">{error}</Card>;
  }

  const caregiver = relationship.caregiver;

  return (
    <>
      <Button href="/patient/caregivers" icon={<TablerIcon name="arrow-left" />} variant="secondary">กลับไปหน้าผู้ดูแล</Button>
      <div className="mt-7">
        <PageTitle title="จัดการสิทธิ์ผู้ดูแล" subtitle="ตรวจสอบสิทธิ์และจัดการผู้ดูแลที่เชื่อมต่อกับบัญชีของคุณ" />
      </div>
      <Card className="overflow-hidden rounded-[28px] border-blue-100 bg-white/95 p-0 shadow-[0_14px_40px_rgba(20,46,86,0.08)]">
        <div className="flex flex-col gap-5 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-white p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm">
              <TablerIcon name="heart" className="h-8 w-8" />
            </span>
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-navy-900">{caregiver.name}</h2>
              <p className="mt-1 break-all text-slate-600">{caregiver.email}</p>
            </div>
          </div>
          <Badge tone={relationship.status === "approved" ? "success" : "warning"}>
            {relationship.status === "approved" ? "ใช้งานอยู่" : "รอตอบรับ"}
          </Badge>
        </div>

        <div className="p-6 md:p-8">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-5 py-4">
            <p className="text-sm font-semibold text-slate-500">ความสัมพันธ์</p>
            <p className="mt-1 text-lg font-bold text-navy-900">{relationship.relationship_label || "ยังไม่ได้ระบุ"}</p>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-bold text-navy-900">สิทธิ์ที่อนุญาตในปัจจุบัน</h3>
            <p className="mt-1 text-sm text-slate-500">ตรวจสอบสิ่งที่ผู้ดูแลสามารถเข้าถึงได้</p>
            <div className="mt-4 divide-y divide-blue-100 rounded-2xl border border-blue-100">
              {[
                ["pill", "จัดการรายการยา", relationship.can_edit_medication],
                ["calendar-time", "จัดการนัดหมาย", relationship.can_edit_appointment],
                ["clipboard-list", "ดูประวัติสุขภาพ", relationship.can_view_history],
              ].map(([icon, label, allowed]) => (
                <div className="flex items-center justify-between gap-4 px-5 py-4" key={String(label)}>
                  <span className="inline-flex items-center gap-3 font-semibold text-navy-900">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                      <TablerIcon name={icon as "pill" | "calendar-time" | "clipboard-list"} className="h-5 w-5" />
                    </span>
                    {label}
                  </span>
                  <Badge tone={allowed ? "success" : "neutral"}>{allowed ? "อนุญาต" : "ไม่อนุญาต"}</Badge>
                </div>
              ))}
            </div>
          </div>

          {error ? <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p> : null}
          <div className="mt-8 border-t border-blue-100 pt-6">
            <p className="mb-3 text-sm text-slate-500">หากยกเลิก ผู้ดูแลจะไม่สามารถเข้าถึงข้อมูลของคุณได้อีก</p>
            <Button disabled={isRevoking} icon={<TablerIcon name="x" />} onClick={handleRevoke} variant="danger">
              {isRevoking ? "กำลังยกเลิก..." : "ยกเลิกสิทธิ์ผู้ดูแล"}
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
}
