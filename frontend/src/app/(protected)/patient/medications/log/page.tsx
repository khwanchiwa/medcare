import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/card";
import { getMedicationLogs } from "@/mocks/mock-medications";

export default async function MedicationLogPage() {
  const logs = await getMedicationLogs();
  return <><PageTitle title="ประวัติการทานยา" subtitle="ตารางย้อนหลังพร้อมสถานะทานยา" /><Card><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left"><thead className="text-slate-600"><tr><th className="p-3">ยา</th><th className="p-3">เวลาที่กำหนด</th><th className="p-3">เวลาที่ทาน</th><th className="p-3">สถานะ</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id} className="border-t border-border"><td className="p-3 font-semibold">{log.medicationName}</td><td className="p-3 font-mono">{log.scheduledAt}</td><td className="p-3 font-mono">{log.takenAt ?? "ยังไม่บันทึก"}</td><td className="p-3"><Badge tone={log.status === "ทานแล้ว" ? "success" : log.status === "พลาด" ? "warning" : "info"}>{log.status}</Badge></td></tr>)}</tbody></table></div></Card></>;
}
