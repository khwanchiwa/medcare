"use client";

import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TablerIcon } from "@/components/ui/tabler-icons";
import { listCaregiverRelationships } from "@/features/caregiver-relationship/api";
import type { CaregiverRelationship } from "@/features/caregiver-relationship/types";

const statusLabels: Record<CaregiverRelationship["status"], string> = {
  approved: "ใช้งานอยู่",
  pending: "รอตอบรับ",
  declined: "ปฏิเสธแล้ว",
  revoked: "ยกเลิกแล้ว",
};

export default function CaregiversPage() {
  const [relationships, setRelationships] = useState<CaregiverRelationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRelationships = useCallback(() => {
    return listCaregiverRelationships()
      .then(setRelationships)
      .catch((reason: unknown) => {
        const detail = reason instanceof Error ? reason.message : "";
        setError(detail || "ไม่สามารถโหลดรายชื่อผู้ดูแลได้");
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    void loadRelationships();
  }, [loadRelationships]);

  const retryRelationships = () => {
    setIsLoading(true);
    setError("");
    void loadRelationships();
  };

  const pendingCount = relationships.filter((item) => item.status === "pending").length;
  const editableCount = relationships.filter((item) => item.can_edit_medication || item.can_edit_appointment).length;

  return (
    <>
      <div className="mb-6 overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-navy-900 via-[#19466f] to-[#216fa7] p-6 text-white shadow-[0_18px_50px_rgba(20,46,86,0.16)] md:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">ผู้ดูแลของคุณ</h1>
            <p className="mt-3 text-lg leading-8 text-blue-100">
              เพิ่มผู้ดูแลด้วยอีเมลบัญชีจริง จัดการสิทธิ์ และให้ผู้ดูแลช่วยติดตามยาและนัดหมายของคุณได้ในที่เดียว
            </p>
          </div>
          <Button href="/patient/caregivers/invite" icon={<TablerIcon name="mail" />} variant="secondary">เชิญผู้ดูแล</Button>
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        {[
          { label: "ผู้ดูแลทั้งหมด", value: relationships.length, icon: "users" as const, tone: "bg-blue-50 text-navy-800" },
          { label: "มีสิทธิ์ช่วยแก้ไข", value: editableCount, icon: "edit" as const, tone: "bg-amber-100 text-amber-600" },
        ].map((item) => (
          <Card key={item.label} className="rounded-[24px] border-blue-100 bg-white/95 p-5 shadow-[0_10px_30px_rgba(20,46,86,0.06)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                <p className="mt-2 text-4xl font-bold text-navy-900">{isLoading ? "-" : item.value}</p>
              </div>
              <span className={`grid h-14 w-14 place-items-center rounded-2xl ${item.tone}`}>
                <TablerIcon name={item.icon} className="h-7 w-7" />
              </span>
            </div>
          </Card>
        ))}
      </div>

      {isLoading ? <Skeleton label="กำลังโหลดผู้ดูแล" /> : null}
      {error ? (
        <div className="flex flex-col gap-3 rounded-xl bg-red-50 px-4 py-3 text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">ไม่สามารถโหลดรายชื่อผู้ดูแลได้</p>
            {error !== "ไม่สามารถโหลดรายชื่อผู้ดูแลได้" ? <p className="mt-1 text-sm">{error}</p> : null}
          </div>
          <button
            type="button"
            onClick={retryRelationships}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 font-semibold text-red-700 transition hover:bg-red-100"
          >
            <TablerIcon name="refresh" className="h-5 w-5" />
            ลองใหม่
          </button>
        </div>
      ) : null}
      {!isLoading && !error && !relationships.length ? (
        <Card className="overflow-hidden rounded-[28px] border-blue-100 bg-white/95 p-0 shadow-[0_14px_40px_rgba(20,46,86,0.08)]">
          <div className="grid place-items-center p-6 md:p-8">
            <div className="flex max-w-2xl flex-col items-center gap-4 text-center">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-blue-50 text-blue-600">
                <TablerIcon name="users" className="h-8 w-8" />
              </span>
              <div className="grid justify-items-center">
                <h2 className="text-2xl font-bold text-navy-900">ยังไม่มีผู้ดูแลที่ผูกไว้</h2>
                <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
                  เชิญผู้ดูแลจากอีเมลบัญชีผู้ดูแลจริง เพื่อให้ช่วยดูรายการยา นัดหมาย และประวัติสุขภาพของคุณ
                </p>
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      {!isLoading && !error && relationships.length ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-navy-900">รายชื่อผู้ดูแล</h2>
            <p className="mt-1 text-slate-500">{pendingCount ? `มีคำเชิญรอตอบรับ ${pendingCount} รายการ` : "จัดการผู้ดูแลที่เชื่อมต่อกับบัญชีของคุณ"}</p>
          </div>
          <Button href="/patient/caregivers/invite" icon={<TablerIcon name="plus" />} variant="secondary">เพิ่มอีกคน</Button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {relationships.map((relationship) => {
          const caregiver = relationship.caregiver;
          const isActive = relationship.status === "approved";
          return (
            <Card key={relationship.id} className="overflow-hidden rounded-[24px] border-blue-100 bg-white/95 p-0 shadow-[0_10px_30px_rgba(20,46,86,0.06)]">
              <div className="border-b border-blue-50 bg-gradient-to-r from-blue-50 to-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm">
                      <TablerIcon name="heart" className="h-7 w-7" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-2xl font-bold text-navy-900">{caregiver.name}</h3>
                      <a className="mt-1 block break-all text-sm font-semibold text-navy-800 underline-offset-4 hover:underline" href={`mailto:${caregiver.email}`}>
                        {caregiver.email}
                      </a>
                    </div>
                  </div>
                  <Badge tone={isActive ? "success" : "warning"}>{statusLabels[relationship.status]}</Badge>
                </div>
              </div>
              <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-500">ความสัมพันธ์</p>
                  <p className="mt-1 text-lg font-bold text-navy-900">{relationship.relationship_label || "ยังไม่ได้ระบุ"}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button href={`/patient/caregivers/${relationship.id}`} icon={<TablerIcon name="edit" />} variant="secondary">จัดการสิทธิ์</Button>
              </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
