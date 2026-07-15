"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TablerIcon } from "@/components/ui/tabler-icons";
import { login } from "@/features/auth/api";
import { ApiError } from "@/lib/api-client";
import { saveSession } from "@/lib/auth/session";

type Role = "patient" | "caregiver";

function LogoIcon() {
  return (
    <span className="block h-16 w-44 overflow-hidden rounded-2xl">
      <Image src="/icons/Logo_medcare_cropped.png" alt="MedCare" width={176} height={64} className="h-full w-full object-contain" priority />
    </span>
  );
}

function PatientIcon() {
  return <TablerIcon name="user" className="h-5 w-5" />;
}

function CaregiverIcon() {
  return <TablerIcon name="users" className="h-5 w-5" />;
}

function MailIcon() {
  return <TablerIcon name="mail" className="h-5 w-5" />;
}

function LockIcon() {
  return <TablerIcon name="lock" className="h-5 w-5" />;
}

function CheckIcon() {
  return <TablerIcon name="check" className="h-4 w-4" />;
}

function Field({
  id,
  label,
  type,
  placeholder,
  icon,
}: {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  icon: React.ReactNode;
}) {
  const isPassword = type === "password";
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <label htmlFor={id} className="grid gap-2 text-[15px] font-semibold text-slate-800">
      <span>{label}</span>
      <span className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-slate-400 shadow-sm transition-all duration-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/25">
        {icon}
        <input
          id={id}
          name={id}
          type={isPassword && isPasswordVisible ? "text" : type}
          placeholder={placeholder}
          required
          autoComplete={type === "password" ? "current-password" : "email"}
          className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 focus:outline-none focus-visible:outline-none"
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            className="-mr-2 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-blue-50 hover:text-[#0F4C81] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={isPasswordVisible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            aria-pressed={isPasswordVisible}
          >
            <TablerIcon name={isPasswordVisible ? "eye-off" : "eye"} className="h-5 w-5" />
          </button>
        ) : null}
      </span>
    </label>
  );
}

const roles: {
  id: Role;
  title: string;
  detail: string;
  icon: React.ReactNode;
  href: string;
  button: string;
}[] = [
  {
    id: "patient",
    title: "ดูแลตัวเอง",
    detail: "จัดการยาและนัดหมายของตนเอง",
    icon: <PatientIcon />,
    href: "/patient/dashboard",
    button: "เข้าสู่ระบบ",
  },
  {
    id: "caregiver",
    title: "ดูแลผู้ป่วย",
    detail: "ติดตามการใช้ยาและนัดหมายของผู้ป่วย",
    icon: <CaregiverIcon />,
    href: "/caregiver/dashboard",
    button: "เข้าสู่ระบบ",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>("patient");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeRole = roles.find((role) => role.id === selectedRole) ?? roles[0];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const notice = window.sessionStorage.getItem("medcare_login_notice");
      if (!notice) return;
      setError(notice);
      window.sessionStorage.removeItem("medcare_login_notice");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      const session = await login({
        email: String(formData.get("email") ?? "").trim(),
        password: String(formData.get("password") ?? ""),
      });
      const authenticatedRole = session.user.role.toLowerCase();
      if (authenticatedRole !== selectedRole) {
        const roleLabel = session.user.role === "PATIENT" ? "ผู้ป่วย" : "ผู้ดูแล";
        setError(`บัญชีนี้เป็นบัญชี${roleLabel} กรุณาเลือกประเภทบัญชีให้ถูกต้อง`);
        return;
      }
      if (!session.access_token || !session.refresh_token) {
        setError("บัญชียังไม่มี session กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ");
        return;
      }
      saveSession(session);
      router.replace(activeRole.href);
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        setError("ไม่พบบัญชีหรือรหัสผ่านไม่ถูกต้อง หากยังไม่มีบัญชี กรุณาสมัครบัญชีก่อน");
      } else if (caughtError instanceof ApiError) {
        setError(caughtError.message);
      } else {
        setError("ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="relative flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden bg-slate-50 px-4 py-8">
      <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-blue-100 blur-3xl" aria-hidden="true" />
      <div className="absolute -right-20 bottom-12 h-80 w-80 rounded-full bg-cyan-100/80 blur-3xl" aria-hidden="true" />
      <div className="absolute left-1/2 top-10 h-40 w-40 -translate-x-1/2 rounded-full bg-white/70 blur-2xl" aria-hidden="true" />

      <div className="relative w-full max-w-[500px] animate-[fadeIn_300ms_ease-out]">
        <div className="rounded-[24px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-blue-900/10 backdrop-blur md:p-7">
          <Link href="/" className="mx-auto mb-5 flex w-fit items-center rounded-2xl transition-opacity duration-300 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <LogoIcon />
          </Link>

          <div className="mb-4 text-center">
            <h1 className="text-3xl font-bold leading-tight text-slate-950">ยินดีต้อนรับ</h1>
            <p className="mt-2 text-base leading-7 text-slate-500">
              เข้าสู่ระบบเพื่อจัดการยาและการนัดหมายของคุณ
            </p>
          </div>

        <div className="mb-3">
          <p className="text-base font-semibold">เลือกประเภทบัญชีที่ต้องการเข้าสู่ระบบ</p>
        </div>
          <div className="mb-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="เลือกบทบาทสำหรับเข้าสู่ระบบ">
            {roles.map((role) => {
              const active = role.id === selectedRole;
              return (
                <button
                  key={role.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelectedRole(role.id)}
                  className={`relative min-h-[116px] rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    active
                      ? "border-[#2A7CC7] bg-blue-50 shadow-md shadow-blue-900/10"
                      : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                  }`}
                >
                  <span className={`mb-3 grid h-10 w-10 place-items-center rounded-2xl ${active ? "bg-white text-[#0F4C81]" : "bg-slate-50 text-slate-500"}`}>
                    {role.icon}
                  </span>
                  <span className="block text-base font-bold text-slate-950">{role.title}</span>
                  <span className="mt-1 block text-sm leading-5 text-slate-500">{role.detail}</span>
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
            <Field id="email" label="อีเมล" type="email" placeholder="กรอกอีเมล" icon={<MailIcon />} />
            <Field id="password" label="รหัสผ่าน" type="password" placeholder="กรอกรหัสผ่าน" icon={<LockIcon />} />

            {error ? (
              <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#0F4C81] to-[#2A7CC7] px-5 text-base font-semibold !text-white shadow-lg shadow-blue-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:from-[#0B3D68] hover:to-[#216BAE] hover:!text-white hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-label={activeRole.button}
            >
              <span className="text-white">{isSubmitting ? "กำลังเข้าสู่ระบบ..." : activeRole.button}</span>
            </button>

            <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 pt-2 text-sm font-semibold text-slate-500">
              <span className="text-slate-500">ยังไม่มีบัญชี?</span>
              <Link
                className="rounded-lg px-2 py-1 text-[#0F4C81] transition-colors duration-300 hover:bg-blue-50 hover:text-[#2A7CC7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                href="/register"
              >
                สมัครสมาชิก
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
