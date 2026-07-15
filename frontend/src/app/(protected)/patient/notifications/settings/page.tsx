import { Button } from "@/components/ui/button";
import { Card, PageTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TablerIcon } from "@/components/ui/tabler-icons";

export default function NotificationSettingsPage() {
  return <><PageTitle title="ตั้งค่าการแจ้งเตือน" subtitle="เลือกเวลาแจ้งเตือนในระบบ" /><Card><div className="grid gap-5"><Switch label="แจ้งเตือนในระบบ" defaultChecked /><Input label="แจ้งเตือนก่อนนัดหมาย" defaultValue="24 ชั่วโมง" required /><Button icon={<TablerIcon name="check" />}>บันทึกการตั้งค่าแจ้งเตือน</Button></div></Card></>;
}
