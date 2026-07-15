"use client";

import { useState } from "react";

import { updateProfile } from "@/features/auth/api";
import { useAuthUser } from "@/features/auth/hooks";
import { ApiError } from "@/lib/api-client";
import { updateStoredUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TablerIcon } from "@/components/ui/tabler-icons";
import type { AuthUser } from "@/features/auth/types";

export function ProfileCard({ roleLabel }: { roleLabel: string }) {
  const user = useAuthUser();

  if (!user) {
    return <Skeleton label="กำลังโหลดโปรไฟล์" />;
  }

  return <LoadedProfileCard user={user} roleLabel={roleLabel} />;
}

function LoadedProfileCard({ user, roleLabel }: { user: AuthUser; roleLabel: string }) {
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    if (name.trim().length < 2) {
      setError("กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProfile(name.trim());
      updateStoredUser(updated);
      setName(updated.name);
      setMessage("บันทึกชื่อโปรไฟล์แล้ว");
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "ไม่สามารถบันทึกโปรไฟล์ได้");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-[28px] border border-blue-100 bg-white/95 shadow-[0_14px_40px_rgba(20,46,86,0.08)]">
      <div className="flex flex-col gap-5 border-b border-blue-100 bg-gradient-to-r from-blue-50 via-white to-cyan-50 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex min-w-0 items-center gap-5">
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-[24px] bg-gradient-to-br from-blue-100 to-cyan-100 text-3xl font-bold text-blue-700 ring-4 ring-white shadow-md sm:h-24 sm:w-24 sm:text-4xl">
            {user.name.trim().charAt(0).toUpperCase() || "M"}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-bold text-navy-900 sm:text-3xl">{user.name}</h2>
            <p className="mt-1 break-all text-slate-500">{user.email}</p>
          </div>
        </div>
        <span className="inline-flex w-fit rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy-900 shadow-sm ring-1 ring-blue-100">{roleLabel}</span>
      </div>

      <div className="p-6 sm:p-8">
          <div className="mb-7 flex items-center gap-3 border-b border-blue-100 pb-5">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <TablerIcon name="edit" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-navy-900">ข้อมูลพื้นฐาน</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">แก้ไขชื่อที่แสดงในระบบ</p>
            </div>
          </div>

          <form className="grid gap-6" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <Input label="ชื่อ-นามสกุล" value={name} onChange={(event) => setName(event.target.value)} required />
              <Input label="อีเมล" value={user.email} readOnly className="cursor-not-allowed bg-slate-50 text-slate-500" />
              <Input label="ผู้ดูแล (ถ้ามี)" value={user.caregiver_name || "ยังไม่มีผู้ดูแล"} readOnly className="cursor-not-allowed bg-slate-50 text-slate-500" />
              <Input label="ประเภทบัญชี" value={roleLabel} readOnly className="cursor-not-allowed bg-slate-50 text-slate-500" />
            </div>

            {message ? <p role="status" className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">{message}</p> : null}
            {error ? <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
            <div className="flex justify-end border-t border-blue-100 pt-5">
              <Button type="submit" disabled={saving} icon={<TablerIcon name="edit" />}>
                {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
              </Button>
            </div>
          </form>
      </div>
    </section>
  );
}
