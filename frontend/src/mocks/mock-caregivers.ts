export type Caregiver = {
  id: string;
  name: string;
  email: string;
  relationship: string;
  status: "active" | "pending";
  permissions: string[];
};

export type AccessRequest = {
  id: string;
  patientName: string;
  relationship: string;
  requestedAt: string;
};

export const caregivers: Caregiver[] = [
  { id: "caregiver-1", name: "ปาริชาติ ใจดี", email: "parichat@example.com", relationship: "บุตรสาว", status: "active", permissions: ["ดูรายการยา", "ดูนัดหมาย", "รับแจ้งเตือน"] },
  { id: "caregiver-2", name: "กิตติ ใจดี", email: "kitti@example.com", relationship: "บุตรชาย", status: "pending", permissions: ["ดูนัดหมาย"] },
];

export const accessRequests: AccessRequest[] = [
  { id: "req-1", patientName: "สมชาย ใจดี", relationship: "บิดา", requestedAt: "6 ก.ค. 2569 09:00" },
  { id: "req-2", patientName: "มาลี สุขภาพ", relationship: "มารดา", requestedAt: "5 ก.ค. 2569 17:20" },
];

export async function getCaregivers() {
  return caregivers;
}

export async function getCaregiver(id: string) {
  return caregivers.find((item) => item.id === id) ?? caregivers[0];
}

export async function getAccessRequests() {
  return accessRequests;
}
