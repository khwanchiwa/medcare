import Link from "next/link";

import { AppointmentForm } from "@/components/appointment/AppointmentForm";
import { PageTitle } from "@/components/ui/card";
import { TablerIcon } from "@/components/ui/tabler-icons";
import { getAppointment } from "@/mocks/mock-appointments";

export default async function EditAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appointment = await getAppointment(id);
  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link href={`/patient/appointments/${id}`} className="mb-6 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 font-semibold text-blue-600 transition-colors hover:bg-blue-100 hover:text-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        <TablerIcon name="arrow-left" className="h-5 w-5" />
        กลับไปหน้านัดหมาย
      </Link>
      <PageTitle title="แก้ไขนัดหมาย" subtitle={appointment.title} />
      <AppointmentForm appointment={appointment} />
    </div>
  );
}
