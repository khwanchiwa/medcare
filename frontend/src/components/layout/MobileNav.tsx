"use client";

import Link from "next/link";
import { useState } from "react";

import { TablerIcon } from "../ui/tabler-icons";

export function MobileNav({ items }: { items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 top-4 z-40 inline-flex min-h-11 items-center justify-center gap-2 rounded-card bg-blue-600 px-4 py-2 text-base font-semibold text-white shadow-[0_12px_28px_rgba(21,95,143,0.22)] transition hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="เปิดเมนู"
        aria-expanded={open}
      >
        <TablerIcon name="menu-2" className="h-5 w-5" />
        <span>เมนู</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-navy-900/70 p-3 backdrop-blur-sm">
          <div className="mx-auto grid max-w-sm gap-3 rounded-[24px] bg-white p-4 shadow-[0_22px_55px_rgba(20,46,86,0.18)]">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <p className="text-sm font-semibold text-blue-600">MedCare</p>
                <p className="text-lg font-bold text-navy-900">เมนูนำทาง</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-card border border-border text-navy-900 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="ปิดเมนู"
              >
                <TablerIcon name="x" className="h-5 w-5" />
              </button>
            </div>

            <nav className="grid gap-2">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center justify-between rounded-card px-4 py-3 font-semibold text-slate-800 transition hover:bg-blue-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span>{item.label}</span>
                  <TablerIcon name="chevron-right" className="h-5 w-5" />
                </Link>
              ))}
            </nav>

            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-card border border-border bg-sky-50 px-4 py-3 font-semibold text-navy-800 transition hover:bg-blue-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <TablerIcon name="logout" className="h-5 w-5" />
              ออกจากระบบ
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
