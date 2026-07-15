import { CaregiverInviteForm } from "@/components/caregiver/CaregiverInviteForm";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/card";
import { TablerIcon } from "@/components/ui/tabler-icons";

export default function InviteCaregiverPage() {
  return (
    <>
      <Button href="/patient/caregivers" icon={<TablerIcon name="arrow-left" />} variant="secondary">
        กลับไปหน้าผู้ดูแล
      </Button>
      <div className="mt-7">
        <PageTitle title="เชิญผู้ดูแล" subtitle="กรอกอีเมลบัญชีผู้ดูแลจริงเพื่อผูกผู้ดูแลเข้ากับบัญชีของคุณ" />
      </div>
      <CaregiverInviteForm />
    </>
  );
}
