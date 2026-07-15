import { apiRequest, clearApiCache } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth/session";
import type { CaregiverInvitePayload, CaregiverRelationship } from "./types";

function authHeaders(): HeadersInit {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function listCaregiverRelationships(): Promise<CaregiverRelationship[]> {
  return apiRequest<CaregiverRelationship[]>("/relationships", {
    headers: authHeaders(),
    cacheTtlMs: 15_000,
  });
}

export function inviteCaregiver(payload: CaregiverInvitePayload): Promise<CaregiverRelationship> {
  return apiRequest<CaregiverRelationship>("/relationships/invite", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  }).then((relationship) => {
    clearApiCache("/relationships");
    return relationship;
  });
}

export function revokeCaregiverRelationship(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/relationships/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  }).then((result) => {
    clearApiCache("/relationships");
    return result;
  });
}
