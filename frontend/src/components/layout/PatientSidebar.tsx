import Image from "next/image";
import Link from "next/link";

import { TablerIcon, type IconName } from "../ui/tabler-icons";

const items: { href: string; label: string; icon: IconName }[] = [
  { href: "/patient/dashboard", label: "แดชบอร์ด", icon: "home" },
  { href: "/patient/medications", label: "รายการยา", icon: "pill" },
  { href: "/patient/appointments", label: "นัดหมาย", icon: "calendar-time" },
  { href: "/patient/profile", label: "โปรไฟล์", icon: "user" },
];

export function PatientSidebar() {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 flex-col border-r border-border bg-white/95 p-5 text-navy-900 shadow-[0_18px_50px_rgba(27,108,158,0.08)] lg:fixed lg:inset-y-0 lg:left-0 lg:flex">
      <Link href="/" className="mb-8 flex w-fit items-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        <span className="block h-14 w-40 overflow-hidden rounded-2xl">
          <Image src="/icons/Logo_medcare_cropped.png" alt="MedCare" width={160} height={56} className="h-full w-full object-contain" priority />
        </span>
      </Link>
      <nav className="grid gap-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-11 items-center gap-3 rounded-card px-4 py-3 font-semibold text-slate-600 transition hover:bg-blue-100 hover:text-blue-600 focus-visible:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <TablerIcon name={item.icon} className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <Link
        href="/login"
        className="mt-auto flex min-h-11 items-center gap-3 rounded-card border border-border bg-white px-4 py-3 font-semibold text-navy-800 shadow-[0_10px_24px_rgba(20,46,86,0.06)] transition hover:bg-blue-100 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <TablerIcon name="logout" className="h-5 w-5" />
        <span>ออกจากระบบ</span>
      </Link>
    </aside>
  );
}
