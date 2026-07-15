import { GoogleCalendarConnectionCard } from "@/components/integrations/GoogleCalendarConnectionCard";
import { PageTitle } from "@/components/ui/card";
export default function IntegrationsPage() {
  return <><PageTitle title="การเชื่อมต่อ" subtitle="เชื่อมบัญชีเพื่อซิงค์นัดหมาย" /><div className="grid gap-4"><GoogleCalendarConnectionCard /></div></>;
}
