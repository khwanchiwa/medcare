import { ProfileCard } from "@/components/profile/ProfileCard";

export default function PatientProfilePage() {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8">
      <section className="overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-navy-900 via-[#19466f] to-[#216fa7] p-6 text-white shadow-[0_18px_50px_rgba(20,46,86,0.16)] md:p-8">
        <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">ตั้งค่าโปรไฟล์</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-blue-100">จัดการข้อมูลบัญชีและข้อมูลพื้นฐานที่ใช้ในระบบ MedCare</p>
      </section>
      <ProfileCard roleLabel="ผู้ป่วย" />
    </div>
  );
}
