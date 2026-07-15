import Link from "next/link";
import Image from "next/image";
import { TablerIcon } from "@/components/ui/tabler-icons";

function LogoIcon({ className = "h-16 w-40" }: { className?: string }) {
  return (
    <span className={`block overflow-hidden rounded-2xl ${className}`}>
      <Image
        src="/icons/Logo_medcare_cropped.png"
        alt="MedCare"
        width={160}
        height={64}
        className="h-full w-full object-contain"
        priority
      />
    </span>
  );
}

function PillIcon() {
  return <TablerIcon name="pill" className="h-10 w-10" />;
}

function CalendarIcon({ className = "h-10 w-10" }: { className?: string }) {
  return <TablerIcon name="calendar-time" className={className} />;
}

function ScanIcon() {
  return <TablerIcon name="scan" className="h-10 w-10" />;
}

function ArrowIcon() {
  return <TablerIcon name="arrow-right" className="h-5 w-5" />;
}

const features = [
  {
    icon: <PillIcon />,
    title: "จัดตารางทานยา",
    detail: "ตั้งเวลาเตือน บันทึกการใช้ยา และติดตามประวัติได้ในที่เดียว",
  },
  {
    icon: <CalendarIcon />,
    title: "จัดการการนัดหมาย",
    detail: "บันทึกวันนัด และข้อปฏิบัติก่อนพบแพทย์ พร้อมแจ้งเตือนล่วงหน้า",
  },
  {
    icon: <ScanIcon />,
    title: "สแกนเอกสาร",
    detail: "สแกนฉลากยาและใบนัด เพื่อบันทึกข้อมูลได้อย่างรวดเร็ว",
  },
];

const calendarDays = [
  ["1", ""],
  ["2", ""],
  ["3", "bg-success-100 text-success-600"],
  ["4", ""],
  ["5", ""],
  ["6", ""],
  ["7", ""],
  ["8", ""],
  ["9", ""],
  ["10", ""],
  ["11", ""],
  ["12", "bg-blue-600 text-white shadow-md shadow-blue-900/20"],
  ["13", ""],
  ["14", ""],
  ["15", ""],
  ["16", ""],
  ["17", ""],
  ["18", ""],
  ["19", ""],
  ["20", ""],
  ["21", ""],
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 px-5 py-7 text-navy-900 md:px-8">
      <div className="absolute -left-28 top-16 h-80 w-80 rounded-full bg-blue-100/80 blur-3xl" aria-hidden="true" />
      <div className="absolute -right-24 top-40 h-96 w-96 rounded-full bg-cyan-100/70 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-success-100/60 blur-3xl" aria-hidden="true" />

      <section className="relative mx-auto grid min-h-[58vh] w-full max-w-[1160px] gap-10 pt-2 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div>
          <Link href="/" className="mb-6 flex w-fit items-center rounded-2xl md:mb-8">
            <LogoIcon />
          </Link>

          <span className="inline-flex rounded-full border border-blue-100 bg-white/70 px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm backdrop-blur">
            ผู้ช่วยดูแลสุขภาพของคุณและคนที่คุณรัก
          </span>

          <h3 className="mt-5 max-w-[620px] text-4xl font-bold leading-[1.12] text-navy-900 md:text-5xl">
            จัดการยาและวันนัด
            <br />
            ได้อย่างง่ายดาย
          </h3>
          <p className="mt-6 max-w-[620px] text-lg leading-9 text-slate-600">
            เว็บแอปพลิเคชันสำหรับช่วยเตือนการทานยา จัดการการนัดหมาย
            และสแกนเอกสารทางการแพทย์ เพื่อให้การดูแลสุขภาพเป็นเรื่องง่าย
            แม่นยำ และเข้าถึงข้อมูลได้ทุกที่ทุกเวลา
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#0F4C81] to-[#2A7CC7] px-7 text-base font-semibold !text-white shadow-lg shadow-blue-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:from-[#0B3D68] hover:to-[#216BAE] hover:!text-white hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <ArrowIcon />
            <span className="text-white">เริ่มต้นใช้งาน</span>
          </Link>
        </div>

        <div className="w-full max-w-[460px] justify-self-center rounded-[24px] border border-white/80 bg-white/70 p-3 shadow-xl shadow-blue-900/10 backdrop-blur md:p-4 lg:justify-self-end">
          <div className="mb-3 flex gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-blue-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-blue-400/70" />
          </div>

          <section className="rounded-[22px] border border-blue-100 bg-white/95 p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-blue-600">ปฏิทินการนัดหมาย</p>
                <h2 className="mt-1 text-xl font-bold text-navy-900">กรกฎาคม 2569</h2>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                <CalendarIcon className="h-7 w-7" />
              </span>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-slate-400">
              {["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map(([day, className]) => (
                <span
                  key={day}
                  className={`grid h-7 place-items-center rounded-xl text-xs font-semibold text-slate-500 ${className}`}
                >
                  {day}
                </span>
              ))}
            </div>

            <div className="mt-3 grid gap-2">
              <div className="rounded-2xl border border-success-100 bg-success-100/70 p-2.5">
                <p className="text-xs font-semibold text-success-600">03 ก.ค. 13:00</p>
                <p className="mt-1 text-sm font-bold text-navy-900">ตรวจคลื่นไฟฟ้าหัวใจ</p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-2.5">
                <p className="text-xs font-semibold text-blue-600">12 ก.ค. 09:30</p>
                <p className="mt-1 text-sm font-bold text-navy-900">ตรวจระดับน้ำตาลในเลือด</p>
                <p className="mt-1 text-xs text-slate-600">งดอาหารและน้ำ</p>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="relative mx-auto grid w-full max-w-[1160px] gap-5 pb-10 pt-8 md:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-[24px] border border-white/80 bg-white/75 p-6 text-blue-600 shadow-lg shadow-blue-900/5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl"
          >
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              {feature.icon}
            </span>
            <h2 className="mt-5 text-xl font-bold text-navy-900">{feature.title}</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">{feature.detail}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
