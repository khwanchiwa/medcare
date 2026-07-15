import { GoogleCalendarStatusCard } from "@/components/integrations/GoogleCalendarStatusCard";
import { PageTitle } from "@/components/ui/card";
import { getIntegrations } from "@/mocks/mock-integrations";

export default async function PatientGoogleCalendarPage() {
  const integrations = await getIntegrations();
  return <><PageTitle title="เชื่อมต่อ Google Calendar" subtitle="ดูสถานะซิงค์ล่าสุดและกดซิงค์ใหม่ได้" /><GoogleCalendarStatusCard status={integrations[0]} /></>;
}
