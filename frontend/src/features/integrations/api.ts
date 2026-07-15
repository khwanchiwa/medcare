import { apiRequest } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth/session";
export type IntegrationStatus = { configured: boolean; connected: boolean; connected_at: string | null };
function headers(): HeadersInit { const token = getAccessToken(); return token ? { Authorization: `Bearer ${token}` } : {}; }
export const getGoogleStatus = () => apiRequest<IntegrationStatus>("/integrations/google/status", { headers: headers() });
export const getGoogleAuthUrl = () => apiRequest<{ url: string }>("/integrations/google/auth-url", { method: "POST", headers: headers() });
export const disconnectGoogle = () => apiRequest<{ message: string }>("/integrations/google", { method: "DELETE", headers: headers() });
