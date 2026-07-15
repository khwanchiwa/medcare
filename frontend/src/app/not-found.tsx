import { EmptyMessage } from "@/components/ui/card";

export default function NotFound() {
  return <main className="min-h-screen bg-sky-50 p-6"><EmptyMessage title="ไม่พบหน้าที่ต้องการ" detail="ตรวจสอบที่อยู่หน้าเว็บอีกครั้ง หรือกลับไปหน้าแดชบอร์ดเพื่อเริ่มใหม่" /></main>;
}
