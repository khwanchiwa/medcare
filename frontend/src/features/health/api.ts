import {
  apiRequest,
  clearApiCache,
  DEFAULT_DATA_CACHE_TTL_MS,
} from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth/session";

export type MedicationRecord = {
  id: string;
  patient_id: string;
  name: string;
  dosage: string;
  quantity: string;
  frequency: string;
  reminder_times: string[];
  instructions: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AppointmentRecord = {
  id: string;
  patient_id: string;
  title: string;
  hospital: string | null;
  appointment_date: string;
  appointment_time: string;
  notes: string | null;
  status: "upcoming" | "completed" | "cancelled";
  google_event_id: string | null;
  created_at: string;
  updated_at: string;
};

function authHeaders(): HeadersInit {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type MedicationLogRecord = {
  id: string;
  medication_id: string;
  patient_id: string;
  scheduled_at: string;
  taken_at: string | null;
  status: "pending" | "taken" | "missed";
  note: string | null;
  created_at: string;
};

export function listMedications(): Promise<MedicationRecord[]> {
  return listMedicationsForPatient();
}

export function getMedication(id: string): Promise<MedicationRecord> {
  return apiRequest<MedicationRecord>(`/medications/${id}`, { headers: authHeaders() });
}

export function listMedicationLogs(patientId?: string): Promise<MedicationLogRecord[]> {
  const query = patientId ? `?patient_id=${encodeURIComponent(patientId)}` : "";
  return apiRequest<MedicationLogRecord[]>(`/medications/logs${query}`, {
    headers: authHeaders(),
    cacheTtlMs: DEFAULT_DATA_CACHE_TTL_MS,
  });
}

export function listMedicationsForPatient(patientId?: string): Promise<MedicationRecord[]> {
  const query = patientId ? `?patient_id=${encodeURIComponent(patientId)}` : "";
  return apiRequest<MedicationRecord[]>(`/medications${query}`, {
    headers: authHeaders(),
    cacheTtlMs: DEFAULT_DATA_CACHE_TTL_MS,
  });
}

export function saveMedication(
  payload: Pick<MedicationRecord, "name" | "dosage" | "quantity" | "frequency" | "reminder_times" | "instructions" | "start_date" | "end_date">,
  id?: string,
  patientId?: string,
): Promise<MedicationRecord> {
  const body = patientId ? { ...payload, patient_id: patientId } : payload;
  return apiRequest<MedicationRecord>(id ? `/medications/${id}` : "/medications", {
    method: id ? "PATCH" : "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  }).then((record) => {
    clearApiCache("/medications");
    clearApiCache("/dashboard/caregiver");
    return record;
  });
}

export function deleteMedication(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/medications/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  }).then((result) => {
    clearApiCache("/medications");
    clearApiCache("/dashboard/caregiver");
    return result;
  });
}

export function markMedicationTaken(id: string): Promise<MedicationRecord> {
  return apiRequest<MedicationRecord>(`/medications/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ is_active: false }),
  }).then((record) => {
    clearApiCache("/medications");
    clearApiCache("/dashboard/caregiver");
    return record;
  });
}

export function listAppointments(): Promise<AppointmentRecord[]> {
  return listAppointmentsForPatient();
}

export function getAppointment(id: string): Promise<AppointmentRecord> {
  return apiRequest<AppointmentRecord>(`/appointments/${id}`, { headers: authHeaders() });
}

export function listAppointmentsForPatient(patientId?: string): Promise<AppointmentRecord[]> {
  const query = patientId ? `?patient_id=${encodeURIComponent(patientId)}` : "";
  return apiRequest<AppointmentRecord[]>(`/appointments${query}`, {
    headers: authHeaders(),
    cacheTtlMs: DEFAULT_DATA_CACHE_TTL_MS,
  });
}

export function saveAppointment(
  payload: Pick<AppointmentRecord, "title" | "hospital" | "appointment_date" | "appointment_time" | "notes">,
  id?: string,
  patientId?: string,
): Promise<AppointmentRecord> {
  const body = patientId ? { ...payload, patient_id: patientId } : payload;
  return apiRequest<AppointmentRecord>(id ? `/appointments/${id}` : "/appointments", {
    method: id ? "PATCH" : "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  }).then((record) => {
    clearApiCache("/appointments");
    clearApiCache("/dashboard/caregiver");
    return record;
  });
}

export function deleteAppointment(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/appointments/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  }).then((result) => {
    clearApiCache("/appointments");
    clearApiCache("/dashboard/caregiver");
    return result;
  });
}

export function syncAppointmentToGoogle(id: string): Promise<AppointmentRecord> {
  return apiRequest<AppointmentRecord>(`/appointments/${id}/sync-google`, {
    method: "POST",
    headers: authHeaders(),
  }).then((record) => {
    clearApiCache("/appointments");
    clearApiCache("/dashboard/caregiver");
    return record;
  });
}
