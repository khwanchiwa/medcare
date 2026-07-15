import { Card } from "../ui/card";

export function AdherenceRingChart({ value }: { value: number }) {
  return (
    <Card className="h-full bg-gradient-to-br from-white to-blue-100/45">
      <div>
        <p className="text-sm font-semibold text-blue-600">สถิติ 30 วัน</p>
        <h2 className="mt-1 text-2xl font-bold text-navy-900">ทานยาตรงเวลา</h2>
        <p className="mt-2 text-base leading-7 text-slate-600">ดูความต่อเนื่องของการบันทึกย้อนหลังล่าสุด</p>
      </div>

      <div className="mt-7 flex flex-col items-center text-center">
        <div className="grid h-40 w-40 place-items-center rounded-full border-[18px] border-blue-100 bg-white shadow-[inset_0_2px_10px_rgba(20,46,86,0.06)]" style={{ borderTopColor: "var(--color-success-600)" }}>
          <div>
            <span className="block font-mono text-4xl font-bold text-navy-900">{value}%</span>
            <span className="text-sm font-semibold text-success-600">ดีมาก</span>
          </div>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3">
        <div className="rounded-[20px] bg-success-100 px-4 py-3">
          <p className="text-sm font-semibold text-success-600">ตรงเวลา</p>
          <p className="mt-1 font-mono text-xl font-bold text-navy-900">23</p>
        </div>
        <div className="rounded-[20px] bg-amber-100 px-4 py-3">
          <p className="text-sm font-semibold text-amber-600">รอทาน</p>
          <p className="mt-1 font-mono text-xl font-bold text-navy-900">2</p>
        </div>
      </div>
    </Card>
  );
}
