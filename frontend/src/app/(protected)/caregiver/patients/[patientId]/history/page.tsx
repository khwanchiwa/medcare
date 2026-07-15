import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/card";
import { getMedicationLogs } from "@/mocks/mock-medications";
import { getPatient } from "@/mocks/mock-patients";

export default async function CaregiverPatientHistoryPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  const patient = await getPatient(patientId);
  const logs = await getMedicationLogs(patientId);
  return <><PageTitle title={`ประวัติของ ${patient.name}`} subtitle="ประวัติการทานยาย้อนหลัง" /><Card>{logs.map((log) => <p key={log.id} className="border-b border-border py-3">{log.medicationName} · {log.status} · <span className="font-mono">{log.scheduledAt}</span></p>)}</Card></>;
}
