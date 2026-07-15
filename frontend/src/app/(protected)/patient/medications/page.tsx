"use client";

import { useEffect, useState } from "react";

import { MedicationCard, type MedicationCardData } from "@/components/medication/MedicationCard";
import { Button } from "@/components/ui/button";
import { Card, PageTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TablerIcon } from "@/components/ui/tabler-icons";
import { deleteMedication, listMedications, markMedicationTaken } from "@/features/health/api";

type MedicationFilter = "all" | "pending" | "taken";

const medicationFilters: { id: MedicationFilter; label: string; mobileLabel: string }[] = [
  { id: "all", label: "รายการยาทั้งหมด", mobileLabel: "ทั้งหมด" },
  { id: "pending", label: "รอทาน", mobileLabel: "รอทาน" },
  { id: "taken", label: "ทานแล้ว", mobileLabel: "ทานแล้ว" },
];

function EmptyState({ text }: { text: string }) {
  return (
    <div className="grid min-h-[180px] place-items-center rounded-[24px] border border-blue-100 bg-white/90 px-6 py-10 text-center shadow-[0_12px_30px_rgba(20,46,86,0.06)]">
      <div>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          <TablerIcon name="pill" className="h-7 w-7" />
        </span>
        <p className="mt-4 text-base font-semibold text-slate-500">{text}</p>
      </div>
    </div>
  );
}

export default function MedicationsPage() {
  const [medications, setMedications] = useState<MedicationCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<MedicationFilter>("all");

  useEffect(() => {
    listMedications()
      .then((records) => {
        const takenIds = new Set<string>(JSON.parse(localStorage.getItem("medcare_taken_medications") || "[]"));
        setMedications(records.map((item) => ({
          id: item.id,
          patientId: item.patient_id,
          name: item.name,
          dosage: item.dosage,
          frequency: item.frequency,
          times: item.reminder_times,
          instructions: item.instructions ?? "ไม่มีคำแนะนำเพิ่มเติม",
          status: takenIds.has(item.id) || !item.is_active ? "taken" : "pending",
        })));
      })
      .catch(() => setError("ไม่สามารถโหลดรายการยาได้"))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleDelete(id: string) {
    await deleteMedication(id);
    setMedications((current) => current.filter((item) => item.id !== id));
  }

  async function handleTaken(id: string) {
    await markMedicationTaken(id);
    setMedications((current) => current.map((item) => item.id === id ? { ...item, status: "taken" } : item));
    const takenIds = new Set<string>(JSON.parse(localStorage.getItem("medcare_taken_medications") || "[]"));
    takenIds.add(id);
    localStorage.setItem("medcare_taken_medications", JSON.stringify([...takenIds]));
  }

  const filteredMedications = medications.filter((item) => {
    if (activeFilter === "pending") return item.status === "pending";
    if (activeFilter === "taken") return item.status === "taken";
    return true;
  });

  const emptyText = activeFilter === "pending"
    ? "ยังไม่มียาที่รอทาน"
    : activeFilter === "taken"
      ? "ยังไม่มียาที่ทานแล้ว"
      : "ยังไม่มีรายการยา";
  const activeFilterIndex = medicationFilters.findIndex((filter) => filter.id === activeFilter);

  return <>
    <Card className="mb-6 overflow-hidden rounded-[28px] border-blue-100 bg-gradient-to-br from-white via-blue-50/70 to-sky-50 p-5 shadow-[0_16px_42px_rgba(20,46,86,0.08)] sm:p-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <PageTitle title="รายการยาทั้งหมด" subtitle="ดูข้อมูลยาและการแจ้งเตือนที่บันทึกไว้" />
          <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold text-slate-600">
            <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">ทั้งหมด {medications.length}</span>
          </div>
        </div>
        <div className="grid max-w-[310px] grid-cols-2 gap-2 sm:w-[360px] sm:max-w-none sm:self-start sm:gap-3">
        <div className="[&_a]:min-h-9 [&_a]:rounded-2xl [&_a]:px-2 [&_a]:py-1.5 [&_a]:text-xs [&_svg]:h-4 [&_svg]:w-4 sm:[&_a]:min-h-11 sm:[&_a]:px-5 sm:[&_a]:py-3 sm:[&_a]:text-base sm:[&_svg]:h-5 sm:[&_svg]:w-5">
          <Button href="/patient/medications/scan" icon={<TablerIcon name="scan" />} variant="secondary" full>สแกนฉลากยา</Button>
        </div>
        <div className="[&_a]:min-h-9 [&_a]:rounded-2xl [&_a]:px-2 [&_a]:py-1.5 [&_a]:text-xs [&_svg]:h-4 [&_svg]:w-4 sm:[&_a]:min-h-11 sm:[&_a]:px-5 sm:[&_a]:py-3 sm:[&_a]:text-base sm:[&_svg]:h-5 sm:[&_svg]:w-5">
          <Button href="/patient/medications/new" icon={<TablerIcon name="plus" />} full>เพิ่มยาใหม่</Button>
        </div>
      </div>
      </div>
    </Card>
    <div className="relative mb-6 grid grid-cols-3 rounded-[22px] border border-blue-100 bg-white/90 p-1.5 shadow-[0_8px_24px_rgba(20,46,86,0.06)] backdrop-blur">
      <span
        aria-hidden="true"
        className="absolute bottom-1.5 left-1.5 top-1.5 w-[calc(33.333333%_-_0.25rem)] rounded-[17px] bg-blue-600 shadow-[0_8px_18px_rgba(43,95,206,0.22)] transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${activeFilterIndex * 100}%)` }}
      />
      {medicationFilters.map((filter) => {
        const isActive = activeFilter === filter.id;
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => setActiveFilter(filter.id)}
            className={`relative z-10 min-h-11 min-w-0 rounded-[17px] px-2 text-sm font-semibold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:min-h-12 sm:px-5 sm:text-base ${
              isActive ? "text-white" : "text-slate-500 hover:text-navy-900"
            }`}
          >
            <span className="sm:hidden">{filter.mobileLabel}</span>
            <span className="hidden truncate sm:block">{filter.label}</span>
          </button>
        );
      })}
    </div>
    {isLoading ? <Skeleton label="กำลังโหลดรายการยา" /> : null}
    {error ? <p className="rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-600">{error}</p> : null}
    {!isLoading && !error && !filteredMedications.length ? <EmptyState text={emptyText} /> : null}
    <div className="grid gap-5 lg:grid-cols-2">{filteredMedications.map((item) => <MedicationCard key={item.id} medication={item} onDelete={() => handleDelete(item.id)} onTaken={() => handleTaken(item.id)} />)}</div>
  </>;
}
