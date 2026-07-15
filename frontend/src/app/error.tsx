"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TablerIcon } from "@/components/ui/tabler-icons";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen bg-sky-50 p-6">
      <Card>
        <h1 className="font-serifThai text-3xl font-semibold text-navy-900">เกิดข้อผิดพลาด</h1>
        <p className="mt-2 text-slate-600">ระบบแสดงข้อมูลไม่ได้ในตอนนี้ กรุณาลองโหลดใหม่อีกครั้ง</p>
        <div className="mt-5"><Button icon={<TablerIcon name="refresh" />} onClick={reset}>ลองใหม่</Button></div>
      </Card>
    </main>
  );
}
