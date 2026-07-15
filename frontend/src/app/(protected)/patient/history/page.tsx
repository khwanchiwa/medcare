import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/card";
import { getAppointments } from "@/mocks/mock-appointments";
import { getMedicationLogs } from "@/mocks/mock-medications";

export default async function PatientHistoryPage() {
  const logs = await getMedicationLogs();
  const appointments = await getAppointments();
  return <><PageTitle title="ประวัติรวม" subtitle="รวมประวัติยาและนัดหมายย้อนหลัง" /><div className="grid gap-4 lg:grid-cols-2"><Card><h2 className="font-serifThai text-2xl font-semibold text-navy-900">ยา</h2>{logs.map((log) => <p key={log.id} className="mt-3 border-t border-border pt-3">{log.medicationName} · {log.status} · <span className="font-mono">{log.scheduledAt}</span></p>)}</Card><Card><h2 className="font-serifThai text-2xl font-semibold text-navy-900">นัดหมาย</h2>{appointments.map((appt) => <p key={appt.id} className="mt-3 border-t border-border pt-3">{appt.title} · <span className="font-mono">{appt.date} {appt.time}</span></p>)}</Card></div></>;
}
