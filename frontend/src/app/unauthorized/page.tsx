import { EmptyMessage } from "@/components/ui/card";

export default function UnauthorizedPage() {
  return <main className="min-h-screen bg-sky-50 p-6"><EmptyMessage title="ไม่มีสิทธิ์เข้าถึงหน้านี้" detail="บัญชีนี้ยังไม่ได้รับสิทธิ์สำหรับข้อมูลดังกล่าว กรุณาตรวจสอบบทบาทหรือขอสิทธิ์จากเจ้าของข้อมูล" /></main>;
}
