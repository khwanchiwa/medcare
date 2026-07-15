import { Patient } from "@/mocks/mock-patients";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { TablerIcon } from "../ui/tabler-icons";

export function PatientListItem({ patient }: { patient: Patient }) {
  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-serifThai text-2xl font-semibold text-navy-900">{patient.name}</h3>
          <p className="text-slate-600">{patient.condition}</p>
          <p className="font-mono text-slate-800">อัตราทานยาตรงเวลา {patient.adherence}%</p>
        </div>
        <Button href={`/caregiver/patients/${patient.id}`} icon={<TablerIcon name="chevron-right" />} variant="ghost">ดูข้อมูลผู้ป่วย</Button>
      </div>
    </Card>
  );
}
