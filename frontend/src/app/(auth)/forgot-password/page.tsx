import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { TablerIcon } from "@/components/ui/tabler-icons";

export default function ForgotPasswordPage() {
  return (
    <section className="relative flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden bg-slate-50 px-4 py-8">
      <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl" aria-hidden="true" />
      <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-cyan-100/70 blur-3xl" aria-hidden="true" />
      <div className="absolute left-1/2 top-8 h-48 w-48 -translate-x-1/2 rounded-full bg-white/80 blur-2xl" aria-hidden="true" />

      <div className="relative w-full max-w-[460px] animate-[fadeIn_300ms_ease-out] rounded-[24px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-blue-900/10 backdrop-blur md:p-7">
        <div className="mx-auto flex w-fit items-center justify-center rounded-2xl">
          <span className="block h-16 w-44 overflow-hidden rounded-2xl">
            <Image src="/icons/Logo_medcare_cropped.png" alt="MedCare" width={176} height={64} className="h-full w-full object-contain" priority />
          </span>
        </div>

        <div className="mt-6 text-center">
          <h1 className="text-3xl font-bold text-slate-950">
            ลืมรหัสผ่าน
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-500">
            กรุณากรอกอีเมลที่ใช้ลงทะเบียน เพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่
          </p>
        </div>

        <form className="mt-4 grid gap-3">
          <Input label="อีเมล" type="email" placeholder="กรอกอีเมล" required showRequiredIndicator={false} />

          <button
            type="submit"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0F4C81] to-[#2A7CC7] px-5 text-base font-semibold text-white shadow-lg shadow-blue-900/20 transition-all duration-300 hover:-translate-y-0.5"
          >
            <TablerIcon name="mail" className="h-5 w-5 text-white" />
            <span>ส่งลิงก์ตั้งรหัสผ่านใหม่</span>
          </button>

          <div className="flex justify-center">
            <Link
              href="/login"
              className="rounded-lg px-2 py-2 text-sm font-semibold text-[#0F4C81] hover:bg-blue-50 hover:text-[#2A7CC7]"
            >
              กลับไปที่หน้าเข้าสู่ระบบ
            </Link>
          </div>
        </form>

        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-600">
          <p>หากไม่พบอีเมล โปรดตรวจสอบโฟลเดอร์สแปมหรืออีเมลขยะ</p>
        </div>
      </div>
    </section>
  );
}
