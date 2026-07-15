export type Patient = {
  id: string;
  name: string;
  age: number;
  condition: string;
  adherence: number;
  missedToday: number;
  nextAppointment: string;
};

export const patients: Patient[] = [
  { id: "patient-1", name: "สมชาย ใจดี", age: 67, condition: "ความดันโลหิตสูง, เบาหวาน", adherence: 92, missedToday: 0, nextAppointment: "12 ก.ค. 2569" },
  { id: "patient-2", name: "มาลี สุขภาพ", age: 72, condition: "โรคหัวใจ", adherence: 76, missedToday: 1, nextAppointment: "8 ก.ค. 2569" },
  { id: "patient-3", name: "อนันต์ แสงดี", age: 61, condition: "ไขมันในเลือดสูง", adherence: 88, missedToday: 0, nextAppointment: "20 ก.ค. 2569" },
];

export async function getPatients() {
  return patients;
}

export async function getPatient(id = "patient-1") {
  return patients.find((item) => item.id === id) ?? patients[0];
}
