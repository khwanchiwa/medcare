import { apiRequest } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth/session";

export type MedicineOcrResult = {
  document_type: "MedicineLabel";
  medicine_name: string;
  dosage: string;
  quantity: string;
  frequency: string;
  reminder_times: string[];
  start_date: string;
  end_date: string;
  usage_instruction: string;
  needs_review: boolean;
  warning?: string | null;
};

export type AppointmentOcrResult = {
  document_type: "Appointment";
  appointment_date: string;
  appointment_time: string;
  preparation_instruction: string;
};

export function scanMedicineLabel(file: File): Promise<MedicineOcrResult> {
  return uploadDocument<MedicineOcrResult>("/ocr/medicine", file);
}

export function scanAppointment(file: File): Promise<AppointmentOcrResult> {
  return uploadDocument<AppointmentOcrResult>("/ocr/appointment", file);
}

function uploadDocument<T>(path: string, file: File): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);
  const token = getAccessToken();

  return apiRequest<T>(path, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
}
