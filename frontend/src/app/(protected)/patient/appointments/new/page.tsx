import Link from "next/link";

import { AppointmentForm } from "@/components/appointment/AppointmentForm";
import { PageTitle } from "@/components/ui/card";
import { TablerIcon } from "@/components/ui/tabler-icons";

export default function NewAppointmentPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link href="/patient/appointments" className="mb-6 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 font-semibold text-blue-600 transition-colors hover:bg-blue-100 hover:text-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        <TablerIcon name="arrow-left" className="h-5 w-5" />
        กลับไปหน้านัดหมาย
      </Link>
      <PageTitle title="สร้างนัดหมาย" subtitle="นัดหมายจะถูกเตรียมซิงค์ไปยัง Google Calendar" />
      <AppointmentForm />
    </div>
  );
}
