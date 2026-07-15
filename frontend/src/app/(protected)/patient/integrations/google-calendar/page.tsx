import { GoogleCalendarConnectionCard } from "@/components/integrations/GoogleCalendarConnectionCard";
import { PageTitle } from "@/components/ui/card";

export default function PatientGoogleCalendarPage() {
  return <><PageTitle title="เชื่อมต่อ Google Calendar" subtitle="ดูสถานะซิงค์ล่าสุดและกดซิงค์ใหม่ได้" /><GoogleCalendarConnectionCard /></>;
}
