import { apiRequest } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth/session";

export type IntegrationStatus = {
  configured: boolean;
  connected: boolean;
  reconnect_required: boolean;
  google_email: string | null;
  google_calendar_id: string | null;
  last_sync: string | null;
  connected_at: string | null;
};

export type CalendarSyncResult = {
  message: string;
  created: number;
  updated: number;
  deleted: number;
  unchanged: number;
  failed: number;
};

function headers(): HeadersInit {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getGoogleStatus = (): Promise<IntegrationStatus> =>
  apiRequest<IntegrationStatus>("/integrations/google/status", { headers: headers() });

export const getGoogleAuthUrl = (): Promise<{ url: string }> =>
  apiRequest<{ url: string }>("/integrations/google/auth-url", { method: "POST", headers: headers() });

export const syncGoogleCalendar = (): Promise<CalendarSyncResult> =>
  apiRequest<CalendarSyncResult>("/integrations/google/sync", { method: "POST", headers: headers() });

export const disconnectGoogle = (): Promise<{ message: string }> =>
  apiRequest<{ message: string }>("/integrations/google", { method: "DELETE", headers: headers() });
