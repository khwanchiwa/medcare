"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { TablerIcon, type IconName } from "@/components/ui/tabler-icons";
import { logout } from "@/features/auth/api";
import { useAuthGuard, useAuthUser } from "@/features/auth/hooks";

const navItems: { href: string; label: string; icon: IconName }[] = [
  { href: "/caregiver/dashboard", label: "แดชบอร์ด", icon: "home" },
  { href: "/caregiver/patients", label: "ผู้ป่วย", icon: "users" },
];

export default function CaregiverLayout({ children }: { children: React.ReactNode }) {
  useAuthGuard("CAREGIVER");
  const user = useAuthUser();
  const router = useRouter();
  const pathname = usePathname();
  const profileMenuRef = useRef<HTMLDetailsElement>(null);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const isMobileMenuOpen = mobileMenuPath === pathname;

  useEffect(() => {
    function closeWhenClickingOutside(event: PointerEvent) {
      const menu = profileMenuRef.current;
      if (menu?.open && !menu.contains(event.target as Node)) menu.open = false;
    }

    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && profileMenuRef.current?.open) {
        profileMenuRef.current.open = false;
        profileMenuRef.current.querySelector<HTMLElement>("summary")?.focus();
      }
    }

    document.addEventListener("pointerdown", closeWhenClickingOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeWhenClickingOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const openSwitchModal = () => {
    if (profileMenuRef.current) profileMenuRef.current.open = false;
    setShowSwitchModal(true);
  };
  const confirmSwitchRole = async () => {
    setShowSwitchModal(false);
    await logout();
    router.replace("/login");
  };
  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-navy-900">
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 items-center gap-4 px-5 lg:hidden">
          <Link href="/caregiver/dashboard" className="flex shrink-0 items-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <span className="block h-10 w-28 overflow-hidden rounded-2xl">
              <Image src="/icons/Logo_medcare_cropped.png" alt="MedCare" width={112} height={40} className="h-full w-full object-contain" priority />
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuPath((openPath) => openPath === pathname ? null : pathname)}
              className="grid h-10 w-10 place-items-center rounded-2xl text-slate-600 transition hover:bg-blue-100 hover:text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label={isMobileMenuOpen ? "ปิดเมนู" : "เปิดเมนู"}
              aria-expanded={isMobileMenuOpen}
            >
              <TablerIcon name={isMobileMenuOpen ? "x" : "menu-2"} className="h-7 w-7" />
            </button>
          </div>
        </div>

        {isMobileMenuOpen ? (
          <div className="border-t border-blue-100 bg-white px-5 pb-5 pt-3 shadow-[0_14px_30px_rgba(20,46,86,0.12)] lg:hidden">
            <div className="mb-3 rounded-2xl bg-blue-50 px-4 py-3">
              <p className="truncate font-bold text-navy-900">{user?.name || "ผู้ดูแล"}</p>
              <p className="mt-1 truncate text-sm text-slate-500">{user?.email || "กำลังโหลดข้อมูล..."}</p>
            </div>
            <nav className="grid gap-1" aria-label="เมนูมือถือ">
              <Link href="/caregiver/profile" className="flex min-h-12 items-center gap-3 rounded-xl px-4 font-semibold text-slate-600 transition hover:bg-blue-50">
                <TablerIcon name="user" className="h-5 w-5" />
                โปรไฟล์
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuPath(null);
                  openSwitchModal();
                }}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-left font-semibold text-slate-600 transition hover:bg-blue-50"
              >
                <TablerIcon name="home" className="h-5 w-5" />
                สลับเป็นโหมดผู้ป่วย
              </button>
              <button type="button" onClick={handleLogout} className="flex min-h-12 w-full items-center gap-3 border-t border-blue-100 px-4 pt-1 text-left font-semibold text-red-600 transition hover:bg-red-50">
                <TablerIcon name="logout" className="h-5 w-5" />
                ออกจากระบบ
              </button>
            </nav>
          </div>
        ) : null}

        <div className="mx-auto hidden min-h-16 w-full items-center gap-5 px-5 lg:flex">
          <Link href="/caregiver/dashboard" className="flex shrink-0 items-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <span className="block h-10 w-28 overflow-hidden rounded-2xl">
              <Image src="/icons/Logo_medcare_cropped.png" alt="MedCare" width={112} height={40} className="h-full w-full object-contain" priority />
            </span>
          </Link>

          <nav className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isActive(item.href) ? "bg-blue-100 text-navy-900" : "text-slate-500 hover:bg-blue-100 hover:text-navy-900"
                }`}
              >
                <TablerIcon name={item.icon} className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <details ref={profileMenuRef} className="group relative">
              <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-3 rounded-full bg-slate-100 pl-1 pr-3 text-sm font-semibold text-navy-900 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 [&::-webkit-details-marker]:hidden">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-100 text-blue-600">
                  <TablerIcon name="user" className="h-5 w-5" />
                </span>
                <span className="max-w-28 truncate">{user?.name || "ผู้ดูแล"}</span>
              </summary>

              <div className="absolute right-0 top-[calc(100%+12px)] hidden w-80 overflow-hidden rounded-[18px] border border-border bg-white shadow-[0_16px_38px_rgba(20,46,86,0.14)] group-open:block">
                <div className="border-b border-border px-5 py-4">
                  <p className="truncate text-lg font-bold text-navy-900">{user?.name || "ผู้ดูแล"}</p>
                  <p className="mt-1 truncate text-sm text-slate-500">{user?.email || "กำลังโหลดข้อมูล..."}</p>
                </div>
                <Link href="/caregiver/profile" className="flex min-h-12 items-center gap-3 px-5 font-semibold text-slate-700 transition hover:bg-blue-100">
                  <TablerIcon name="user" className="h-5 w-5" />
                  โปรไฟล์
                </Link>
                <div className="border-t border-border px-5 py-3 text-xs font-semibold text-slate-400">สลับบทบาท</div>
                <button type="button" onClick={openSwitchModal} className="flex min-h-12 w-full items-center gap-3 px-5 text-left font-semibold text-slate-700 transition hover:bg-blue-100">
                  <TablerIcon name="home" className="h-5 w-5" />
                  โหมดผู้ป่วย
                </button>
                <Link href="/caregiver/dashboard" className="flex min-h-12 items-center justify-between gap-3 bg-blue-100 px-5 font-semibold text-blue-600">
                  <span className="inline-flex items-center gap-3">
                    <TablerIcon name="users" className="h-5 w-5" />
                    โหมดผู้ดูแล
                  </span>
                  <span className="text-sm">ใช้งานอยู่</span>
                </Link>
                <button type="button" onClick={handleLogout} className="flex min-h-12 w-full items-center gap-3 border-t border-border px-5 text-left font-semibold text-slate-700 transition hover:bg-blue-100">
                  <TablerIcon name="logout" className="h-5 w-5" />
                  ออกจากระบบ
                </button>
              </div>
            </details>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-5 pb-24 pt-8 md:px-8 lg:px-12 lg:py-10">{children}</main>

      {showSwitchModal ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/55 px-4 backdrop-blur-[1px]" role="dialog" aria-modal="true" aria-labelledby="switch-role-title">
          <div className="w-full max-w-[560px] rounded-[18px] bg-white p-7 shadow-[0_24px_70px_rgba(15,23,42,0.24)]">
            <h2 id="switch-role-title" className="text-2xl font-bold text-slate-950">สลับไปยัง โหมดผู้ป่วย?</h2>
            <p className="mt-4 text-base font-medium text-slate-500">คุณจะถูกสลับไปยัง โหมดผู้ป่วย</p>
            <div className="mt-7 flex justify-end gap-3">
              <button type="button" onClick={() => setShowSwitchModal(false)} className="min-h-11 rounded-2xl bg-slate-100 px-5 font-semibold text-slate-600 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                ยกเลิก
              </button>
              <button type="button" onClick={confirmSwitchRole} className="min-h-11 rounded-2xl bg-blue-600 px-5 font-semibold text-white shadow-[0_8px_20px_rgba(43,95,206,0.22)] transition hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                ดำเนินการต่อ
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <nav className="fixed inset-x-8 bottom-4 z-50 grid grid-cols-2 gap-1 rounded-[22px] border border-border bg-white/95 p-1.5 shadow-[0_8px_24px_rgba(20,46,86,0.14)] backdrop-blur lg:hidden" aria-label="เมนูหลัก">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`grid min-h-12 place-items-center rounded-2xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              isActive(item.href) ? "bg-blue-100 text-navy-900" : "text-slate-500 hover:bg-blue-100 hover:text-navy-900"
            }`}
            aria-label={item.label}
          >
            <TablerIcon name={item.icon} className="h-6 w-6" />
          </Link>
        ))}
      </nav>
    </div>
  );
}
