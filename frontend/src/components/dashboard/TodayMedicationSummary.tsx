import { Medication } from "@/mocks/mock-medications";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { TablerIcon } from "../ui/tabler-icons";

function statusLabel(status: Medication["status"]) {
  if (status === "taken") return "ทานแล้ว";
  if (status === "missed") return "พลาด";
  return "รอทาน";
}

function statusTone(status: Medication["status"]) {
  if (status === "taken") return "success";
  if (status === "missed") return "warning";
  return "info";
}

export function TodayMedicationSummary({ medications }: { medications: Medication[] }) {
  const items = medications.flatMap((med) =>
    med.times.map((time) => ({
      id: `${med.id}-${time}`,
      time,
      name: med.name,
      dosage: med.dosage,
      status: med.status,
    })),
  );

  return (
    <Card className="overflow-hidden p-0">
      <div className="bg-gradient-to-br from-blue-100/80 to-white px-6 py-5 md:px-7">
        <p className="text-sm font-semibold text-blue-600">วันนี้</p>
        <h2 className="mt-1 text-2xl font-bold text-navy-900">เส้นเวลาการทานยา</h2>
        <p className="mt-2 text-base leading-7 text-slate-600">ติดตามเวลาทานยาและสถานะของแต่ละรายการแบบง่าย ๆ</p>
      </div>

      <div className="grid gap-1 px-5 py-4 md:px-6">
        {items.map((item, index) => {
          const done = item.status === "taken";
          const missed = item.status === "missed";
          return (
            <div key={item.id} className="grid grid-cols-[68px_30px_1fr] gap-3">
              <div className="pt-5 text-right font-mono text-sm font-bold text-blue-600">{item.time}</div>
              <div className="relative flex justify-center">
                {index !== items.length - 1 ? <span className="absolute top-10 h-full w-px bg-blue-100" aria-hidden="true" /> : null}
                <span className={`relative mt-4 grid h-8 w-8 place-items-center rounded-full ring-4 ring-white ${
                  done ? "bg-success-100 text-success-600" : missed ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                }`}>
                  <TablerIcon name={done ? "check" : "pill"} className="h-4 w-4" />
                </span>
              </div>
              <div className="py-3">
                <div className="rounded-[20px] border border-blue-100/70 bg-white px-4 py-3 shadow-[0_8px_22px_rgba(20,46,86,0.05)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-slate-900">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.dosage}</p>
                    </div>
                    <Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
