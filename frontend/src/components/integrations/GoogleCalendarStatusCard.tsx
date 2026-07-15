import { IntegrationStatus } from "@/mocks/mock-integrations";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { TablerIcon } from "../ui/tabler-icons";

export function GoogleCalendarStatusCard({ status }: { status: IntegrationStatus }) {
  return (
    <Card>
      <div className="grid gap-4">
        <div className="flex flex-wrap justify-between gap-3">
          <h3 className="font-serifThai text-2xl font-semibold text-navy-900">Google Calendar</h3>
          <Badge tone={status.connected ? "success" : "warning"}>{status.connected ? "เชื่อมต่อแล้ว" : "ยังไม่เชื่อมต่อ"}</Badge>
        </div>
        <p className="text-slate-600">บัญชี: {status.account}</p>
        <p className="font-mono text-slate-800">ซิงค์ล่าสุด {status.lastSync}</p>
        <Button icon={<TablerIcon name="link" />}>{status.connected ? "ซิงค์ Google Calendar ตอนนี้" : "เชื่อมต่อ Google Calendar"}</Button>
      </div>
    </Card>
  );
}
