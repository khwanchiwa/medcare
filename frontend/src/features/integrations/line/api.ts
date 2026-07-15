import { apiRequest, clearApiCache } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth/session";
import type { LineIntegrationStatus } from "./types";

function headers(): HeadersInit {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getLineStatus = (): Promise<LineIntegrationStatus> =>
  apiRequest<LineIntegrationStatus>("/integrations/line/status", { headers: headers() });

export const getLineAuthUrl = (): Promise<{ url: string }> =>
  apiRequest<{ url: string }>("/integrations/line/auth-url", { method: "POST", headers: headers() });

export async function disconnectLine(): Promise<{ message: string }> {
  const result = await apiRequest<{ message: string }>("/integrations/line", {
    method: "DELETE", headers: headers(),
  });
  clearApiCache("/integrations/line");
  return result;
}
