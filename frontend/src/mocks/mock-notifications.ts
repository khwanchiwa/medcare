export type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  channel: "In-app" | "Google Calendar";
  sentAt: string;
  status: "ส่งแล้ว" | "ตั้งเวลาแล้ว";
};

export const notifications: NotificationItem[] = [
  { id: "noti-2", title: "นัดตรวจติดตามความดัน", detail: "ซิงค์กับ Google Calendar", channel: "Google Calendar", sentAt: "ตั้งส่ง 11 ก.ค. 2569 09:30", status: "ตั้งเวลาแล้ว" },
];

export async function getNotifications() {
  return notifications;
}
