import { Badge } from "../ui/badge";

export function GoogleCalendarSyncBadge({ status }: { status: "synced" | "pending" }) {
  return <Badge tone={status === "synced" ? "success" : "warning"}>{status === "synced" ? "บันทึกใน Google Calendar แล้ว" : "รอซิงค์ Google Calendar"}</Badge>;
}
