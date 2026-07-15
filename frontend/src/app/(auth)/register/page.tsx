"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { TablerIcon } from "@/components/ui/tabler-icons";
import { register } from "@/features/auth/api";
import { ApiError } from "@/lib/api-client";
import { saveSession } from "@/lib/auth/session";

type Actor = "patient" | "caregiver";

function ActorIcon({ actor }: { actor: Actor }) {
  return <TablerIcon name={actor === "patient" ? "user" : "users"} className="h-5 w-5" />;
}

function CheckIcon() {
  return <TablerIcon name="check" className="h-4 w-4" />;
}

const actors = [
  {
    id: "patient" as const,
    title: "ดูแลตัวเอง",
    detail: "สมัครเพื่อจัดการยาและการนัดหมายของตนเอง",
    href: "/patient/dashboard",
    button: "สร้างบัญชี",
  },
  {
    id: "caregiver" as const,
    title: "ดูแลผู้ป่วย",
    detail: "สมัครเพื่อติดตามการใช้ยาและการนัดหมายของผู้ป่วย",
    href: "/caregiver/dashboard",
    button: "สร้างบัญชี",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [selectedActor, setSelectedActor] = useState<Actor>("patient");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const activeActor = actors.find((actor) => actor.id === selectedActor) ?? actors[0];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const nameInput = event.currentTarget.querySelector<HTMLInputElement>('input[type="text"]');
    const emailInput = event.currentTarget.querySelector<HTMLInputElement>('input[type="email"]');
    const passwordInput = event.currentTarget.querySelector<HTMLInputElement>('input[name="password"]');
    if (!nameInput || !emailInput || !passwordInput) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    if (nameInput.value.trim().length < 2 || !emailInput.value.trim() || passwordInput.value.length < 8) {
      setError("กรุณากรอกชื่อ อีเมล และรหัสผ่านอย่างน้อย 8 ตัวอักษรให้ครบถ้วน");
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await register({
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value,
        role: selectedActor === "patient" ? "PATIENT" : "CAREGIVER",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Bangkok",
      });
      if (session.access_token && session.refresh_token) {
        saveSession(session);
        router.replace(activeActor.href);
        return;
      }
      setError(null);
      setSuccess("สมัครบัญชีสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี แล้วจึงเข้าสู่ระบบ");
      event.currentTarget.reset();
    } catch (caughtError) {
      setSuccess(null);
      if (caughtError instanceof ApiError) {
        const duplicate = caughtError.message.toLowerCase().includes("already");
        setError(duplicate ? "อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ" : caughtError.message);
      } else {
        setError("ไม่สามารถสมัครบัญชีได้ กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="relative flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden px-4 py-8">
      <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-blue-100 blur-3xl" aria-hidden="true" />
      <div className="absolute -right-20 bottom-12 h-80 w-80 rounded-full bg-cyan-100/80 blur-3xl" aria-hidden="true" />

      <div className="relative w-full max-w-[560px] animate-[fadeIn_300ms_ease-out] rounded-[24px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-blue-900/10 backdrop-blur md:p-7">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-6 flex w-fit items-center justify-center rounded-2xl">
            <span className="block h-16 w-44 overflow-hidden rounded-2xl">
              <Image src="/icons/Logo_medcare_cropped.png" alt="MedCare" width={176} height={64} className="h-full w-full object-contain" priority />
            </span>
          </div>
          <h1 className="text-3xl font-bold leading-tight text-slate-950 md:text-4xl">สร้างบัญชีของคุณ</h1>
          <p className="mt-2 text-base leading-7 text-slate-500">
            หรือ
            <Link
              href="/login"
              className="ml-1 rounded-lg px-2 py-2 text-sm font-semibold text-[#0F4C81] transition-colors duration-300 hover:bg-blue-50 hover:text-[#2A7CC7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              เข้าสู่ระบบบัญชีของคุณ
            </Link>
          </p>
        </div>

        <div className="mb-3">
          <p className="text-base font-semibold">เลือกประเภทบัญชีที่ต้องการสมัคร</p>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="เลือกประเภทบัญชี">
          {actors.map((actor) => {
            const active = actor.id === selectedActor;
            return (
              <button
                key={actor.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelectedActor(actor.id)}
                className={`relative min-h-[118px] rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  active
                    ? "border-[#2A7CC7] bg-blue-50 shadow-md shadow-blue-900/10"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                }`}
              >
                <span className={`mb-3 grid h-10 w-10 place-items-center rounded-2xl ${active ? "bg-white text-[#0F4C81]" : "bg-slate-50 text-slate-500"}`}>
                  <ActorIcon actor={actor.id} />
                </span>
                <span className="block text-base font-bold text-slate-950">{actor.title}</span>
                <span className="mt-1 block text-sm leading-5 text-slate-500">{actor.detail}</span>
                {active ? (
                  <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-[#0F4C81] text-white">
                    <CheckIcon />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Input name="name" label="ชื่อผู้ใช้งาน" placeholder="กรอกชื่อผู้ใช้งาน" required />
          <Input name="email" label="อีเมล" type="email" placeholder="กรอกอีเมล" required />
          <Input name="password" label="รหัสผ่าน" type="password" autoComplete="new-password" placeholder="ตั้งรหัสผ่าน" required />
          {success ? (
            <div role="status" className="grid gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
              <p>{success}</p>
              <Link href="/login" className="text-[#0F4C81] underline">ไปหน้าเข้าสู่ระบบ</Link>
            </div>
          ) : error ? (
            <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#0F4C81] to-[#2A7CC7] px-5 text-base font-semibold !text-white shadow-lg shadow-blue-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:from-[#0B3D68] hover:to-[#216BAE] hover:!text-white hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            aria-label={activeActor.button}
          >
            <span className="text-white">{isSubmitting ? "กำลังสร้างบัญชี..." : activeActor.button}</span>
          </button>
        </form>
      </div>
    </section>
  );
}
