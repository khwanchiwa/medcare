import { apiRequest } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth/session";

export type CaregiverPatientSummary = {
  id: string;
  name: string;
  email: string;
  condition: string;
  active_medications: number;
  taken_medications: number;
  missed_dose_alerts: number;
  upcoming_appointments: number;
  next_appointment: {
    id: string;
    title: string;
    appointment_date: string;
    appointment_time: string;
    status: "upcoming" | "completed" | "cancelled";
  } | null;
};

export type CaregiverDashboard = {
  patients: CaregiverPatientSummary[];
  patient_count: number;
  missed_dose_alerts: number;
  active_medications: number;
  taken_medications: number;
  upcoming_appointments: number;
};

function authHeaders(): HeadersInit {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getCaregiverDashboard(): Promise<CaregiverDashboard> {
  return apiRequest<CaregiverDashboard>("/dashboard/caregiver", {
    headers: authHeaders(),
    cacheTtlMs: 0,
  });
}

export async function getCaregiverPatient(patientId: string): Promise<CaregiverPatientSummary | null> {
  const dashboard = await getCaregiverDashboard();
  return dashboard.patients.find((patient) => patient.id === patientId) ?? null;
}
