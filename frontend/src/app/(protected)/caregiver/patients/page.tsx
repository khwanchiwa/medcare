"use client";

import { useEffect, useState } from "react";

import { PatientOverviewGrid } from "@/components/dashboard/PatientOverviewGrid";
import { Card, PageTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCaregiverDashboard, type CaregiverDashboard } from "@/features/caregiver-dashboard/api";

export default function CaregiverPatientsPage() {
  const [dashboard, setDashboard] = useState<CaregiverDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCaregiverDashboard()
      .then(setDashboard)
      .catch(() => setError("ไม่สามารถโหลดรายชื่อผู้ป่วยได้"))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <>
      <PageTitle title="รายชื่อผู้ป่วย" subtitle="แสดงรายชื่อผู้ป่วยที่เชื่อมโยงกับบัญชีผู้ดูแล" />
      {isLoading ? <Skeleton label="กำลังโหลดรายชื่อผู้ป่วย" /> : null}
      {error ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-600">{error}</p> : null}
      {dashboard && dashboard.patients.length ? <PatientOverviewGrid patients={dashboard.patients} /> : null}
      {dashboard && !dashboard.patients.length ? (
        <Card className="mt-5 grid min-h-[180px] place-items-center text-center font-semibold text-slate-400">
          ยังไม่มีผู้ป่วยที่ผูกกับบัญชีผู้ดูแลนี้
        </Card>
      ) : null}
    </>
  );
}
