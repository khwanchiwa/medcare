import Link from "next/link";

import { MedicationForm } from "@/components/medication/MedicationForm";
import { PageTitle } from "@/components/ui/card";
import { TablerIcon } from "@/components/ui/tabler-icons";

export default function NewMedicationPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link href="/patient/medications" className="mb-6 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 font-semibold text-blue-600 transition-colors hover:bg-blue-100 hover:text-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        <TablerIcon name="arrow-left" className="h-5 w-5" />
        กลับไปรายการยา
      </Link>
      <PageTitle title="เพิ่มยาใหม่" subtitle="กรอกข้อมูลยาและเวลาแจ้งเตือนให้ครบถ้วน" />
      <MedicationForm mode="view" />
    </div>
  );
}
