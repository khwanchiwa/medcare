export type Medication = {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  instructions: string;
  status: "taken" | "pending" | "missed";
  nextDose: string;
};

export type MedicationLog = {
  id: string;
  patientId: string;
  medicationName: string;
  scheduledAt: string;
  takenAt: string | null;
  status: "ทานแล้ว" | "รอทาน" | "พลาด";
};

export const medications: Medication[] = [
  { id: "med-1", patientId: "patient-1", name: "Amlodipine", dosage: "5 mg", frequency: "วันละ 1 ครั้ง", times: ["08:00"], instructions: "ทานหลังอาหารเช้า", status: "taken", nextDose: "พรุ่งนี้ 08:00" },
  { id: "med-2", patientId: "patient-1", name: "Metformin", dosage: "500 mg", frequency: "วันละ 2 ครั้ง", times: ["08:00", "18:00"], instructions: "ทานพร้อมอาหาร", status: "pending", nextDose: "วันนี้ 18:00" },
  { id: "med-3", patientId: "patient-2", name: "Losartan", dosage: "50 mg", frequency: "วันละ 1 ครั้ง", times: ["20:00"], instructions: "วัดความดันก่อนทาน", status: "missed", nextDose: "วันนี้ 20:00" },
];

export const medicationLogs: MedicationLog[] = [
  { id: "log-1", patientId: "patient-1", medicationName: "Amlodipine", scheduledAt: "2026-07-06 08:00", takenAt: "2026-07-06 08:05", status: "ทานแล้ว" },
  { id: "log-2", patientId: "patient-1", medicationName: "Metformin", scheduledAt: "2026-07-06 08:00", takenAt: "2026-07-06 08:10", status: "ทานแล้ว" },
  { id: "log-3", patientId: "patient-1", medicationName: "Metformin", scheduledAt: "2026-07-06 18:00", takenAt: null, status: "รอทาน" },
  { id: "log-4", patientId: "patient-2", medicationName: "Losartan", scheduledAt: "2026-07-05 20:00", takenAt: null, status: "พลาด" },
];

export async function getMedications(patientId = "patient-1") {
  return medications.filter((item) => item.patientId === patientId);
}

export async function getMedication(id: string) {
  return medications.find((item) => item.id === id) ?? medications[0];
}

export async function getMedicationLogs(patientId = "patient-1") {
  return medicationLogs.filter((item) => item.patientId === patientId);
}
