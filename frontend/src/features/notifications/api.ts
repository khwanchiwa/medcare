import { apiRequest } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth/session";

export type NotificationRecord = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  channel: "in_app" | "line" | "google_calendar";
  scheduled_at: string | null;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
};

export type NotificationPreferences = {
  medication_lead_minutes: number;
  appointment_lead_minutes: number[];
  line_enabled: boolean;
};

export type NotificationDelivery = {
  id: string;
  notification_type: "medication" | "appointment";
  reference_id: string;
  scheduled_at: string;
  sent_at: string | null;
  status: "processing" | "sent" | "failed" | "skipped";
  error_message: string | null;
  created_at: string;
};

export const notificationChannelLabels: Record<NotificationRecord["channel"], string> = {
  in_app: "In-app",
  line: "LINE",
  google_calendar: "Google Calendar",
};

function authHeaders(): HeadersInit {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getNotificationStatus(item: NotificationRecord) {
  if (item.sent_at) return "ส่งแล้ว";
  if (item.scheduled_at) return "ตั้งเวลาแล้ว";
  return "รอดำเนินการ";
}

export function formatNotificationDateTime(value: string | null) {
  if (!value) return "ยังไม่กำหนดเวลา";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

export function listNotifications(): Promise<NotificationRecord[]> {
  return apiRequest<NotificationRecord[]>("/notifications", {
    headers: authHeaders(),
    cacheTtlMs: 15_000,
  });
}

export const getNotificationPreferences = (): Promise<NotificationPreferences> =>
  apiRequest<NotificationPreferences>("/notifications/preferences", { headers: authHeaders() });

export const saveNotificationPreferences = (payload: NotificationPreferences): Promise<NotificationPreferences> =>
  apiRequest<NotificationPreferences>("/notifications/preferences", {
    method: "PUT", headers: authHeaders(), body: JSON.stringify(payload),
  });

export const listDeliveryHistory = (): Promise<NotificationDelivery[]> =>
  apiRequest<NotificationDelivery[]>("/notifications/delivery-history", { headers: authHeaders() });
