"use client";

import { useCallback, useEffect, useState } from "react";

import { AppointmentCard, type AppointmentCardData } from "@/components/appointment/AppointmentCard";
import { AppointmentForm } from "@/components/appointment/AppointmentForm";
import { Button } from "@/components/ui/button";
import { Card, PageTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TablerIcon } from "@/components/ui/tabler-icons";
import { getCaregiverPatient, type CaregiverPatientSummary } from "@/features/caregiver-dashboard/api";
import { deleteAppointment, listAppointmentsForPatient, type AppointmentRecord } from "@/features/health/api";
import type { Appointment } from "@/mocks/mock-appointments";

export default function CaregiverPatientAppointmentsPage({ params }: { params: Promise<{ patientId: string }> }) {
  const [patient, setPatient] = useState<CaregiverPatientSummary | null>(null);
  const [appointments, setAppointments] = useState<AppointmentCardData[]>([]);
  const [patientId, setPatientId] = useState("");
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  function toCard(item: AppointmentRecord): AppointmentCardData {
    return {
      id: item.id,
      patientId: item.patient_id,
      title: item.title,
      date: item.appointment_date,
      time: item.appointment_time.slice(0, 5),
      notes: item.notes ?? "ไม่มีข้อปฏิบัติเพิ่มเติม",
      status: item.status === "completed" ? "completed" : "upcoming",
      googleSync: item.google_event_id ? "synced" : "pending",
    };
  }

  function toFormAppointment(item: AppointmentCardData): Appointment {
    return {
      id: item.id,
      patientId: item.patientId,
      title: item.title,
      date: item.date,
      time: item.time,
      notes: item.notes,
      status: item.status,
      googleSync: item.googleSync ?? "pending",
    };
  }

  const loadData = useCallback(async (id: string) => {
    const [patientRecord, appointmentRecords] = await Promise.all([
      getCaregiverPatient(id),
      listAppointmentsForPatient(id),
    ]);
    setPatient(patientRecord);
    setAppointments(appointmentRecords.map(toCard));
  }, []);

  useEffect(() => {
    params
      .then(async ({ patientId }) => {
        setPatientId(patientId);
        await loadData(patientId);
      })
      .catch(() => setError("ไม่สามารถโหลดนัดหมายของผู้ป่วยได้"))
      .finally(() => setIsLoading(false));
  }, [loadData, params]);

  async function handleDelete(id: string) {
    setError("");
    try {
      await deleteAppointment(id);
      if (patientId) await loadData(patientId);
    } catch {
      setError("ไม่สามารถลบนัดหมายได้");
    }
  }

  if (isLoading) return <Skeleton label="กำลังโหลดนัดหมาย" />;
  if (error) return <Card className="grid min-h-[160px] place-items-center text-center font-semibold text-slate-400">{error}</Card>;

  return (
    <>
      <div className="mb-5">
        <Button href={`/caregiver/patients/${patientId}`} icon={<TablerIcon name="arrow-left" />} variant="secondary">กลับไปหน้าข้อมูลผู้ป่วย</Button>
      </div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <PageTitle title={`นัดหมายของ ${patient?.name ?? "ผู้ป่วย"}`} subtitle="ผู้ดูแลสามารถเพิ่ม แก้ไข และลบนัดหมายของผู้ป่วยที่ผูกไว้ได้" />
        <Button href={`/caregiver/patients/${patientId}/appointments/new`} icon={<TablerIcon name="plus" />}>เพิ่มนัดหมาย</Button>
      </div>

      {showForm ? (
        <div className="mb-6">
          <AppointmentForm appointment={editingAppointment ?? undefined} patientId={patientId} returnTo={`/caregiver/patients/${patientId}/appointments`} onSaved={() => loadData(patientId)} />
        </div>
      ) : null}

      {appointments.length ? (
        <div className="grid items-start gap-5 lg:grid-cols-2">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              showDetails={false}
              actions={
                <>
                  <Button full icon={<TablerIcon name="edit" />} onClick={() => { setEditingAppointment(toFormAppointment(appointment)); setShowForm(true); }} variant="secondary">แก้ไขนัดหมาย</Button>
                  <Button full icon={<TablerIcon name="trash" />} onClick={() => handleDelete(appointment.id)} variant="danger">ลบนัดหมาย</Button>
                </>
              }
            />
          ))}
        </div>
      ) : (
        <Card className="grid min-h-[160px] place-items-center text-center font-semibold text-slate-400">ยังไม่มีนัดหมาย</Card>
      )}
    </>
  );
}
