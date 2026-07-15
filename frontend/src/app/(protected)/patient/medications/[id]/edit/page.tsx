import Link from "next/link";

import { MedicationForm } from "@/components/medication/MedicationForm";
import { PageTitle } from "@/components/ui/card";
import { TablerIcon } from "@/components/ui/tabler-icons";
import { getMedication } from "@/mocks/mock-medications";

export default async function EditMedicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const medication = await getMedication(id);
  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link href={`/patient/medications/${id}`} className="mb-6 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 font-semibold text-blue-600 transition-colors hover:bg-blue-100 hover:text-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        <TablerIcon name="arrow-left" className="h-5 w-5" />
        กลับไปหน้ายา
      </Link>
      <PageTitle title="แก้ไขยา" subtitle={medication.name} />
      <MedicationForm mode="edit" medication={medication} />
    </div>
  );
}
