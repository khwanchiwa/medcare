export type Appointment = {
  id: string;
  patientId: string;
  title: string;
  date: string;
  time: string;
  notes: string;
  status: "upcoming" | "completed";
  googleSync: "synced" | "pending";
};

export const appointments: Appointment[] = [
  { id: "appt-1", patientId: "patient-1", title: "ตรวจติดตามความดัน", date: "2026-07-12", time: "09:30", notes: "พักผ่อนให้เพียงพอและนำสมุดบันทึกความดันมาด้วย", status: "upcoming", googleSync: "synced" },
  { id: "appt-2", patientId: "patient-1", title: "ตรวจน้ำตาลสะสม", date: "2026-07-25", time: "13:00", notes: "งดอาหารและเครื่องดื่มก่อนตรวจตามคำแนะนำ", status: "upcoming", googleSync: "pending" },
  { id: "appt-3", patientId: "patient-2", title: "รับยาโรคหัวใจ", date: "2026-07-08", time: "10:00", notes: "นำรายการยาเดิมและบัตรประจำตัวมาด้วย", status: "upcoming", googleSync: "synced" },
];

export async function getAppointments(patientId = "patient-1") {
  return appointments.filter((item) => item.patientId === patientId);
}

export async function getAppointment(id: string) {
  return appointments.find((item) => item.id === id) ?? appointments[0];
}
