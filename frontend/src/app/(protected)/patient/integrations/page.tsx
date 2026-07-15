import { GoogleCalendarConnectionCard } from "@/components/integrations/GoogleCalendarConnectionCard";
import { LineConnectionCard } from "@/components/integrations/LineConnectionCard";
import { PageTitle } from "@/components/ui/card";
export default function IntegrationsPage() {
  return <><PageTitle title="การเชื่อมต่อและการแจ้งเตือน" subtitle="ตั้งค่าบัญชีภายนอกสำหรับ MedCare" /><div className="grid gap-4"><LineConnectionCard /><GoogleCalendarConnectionCard /></div></>;
}
