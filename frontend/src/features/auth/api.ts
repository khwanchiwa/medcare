import { apiRequest, clearApiCache } from "@/lib/api-client";
import { clearSession, getAccessToken, getRefreshToken } from "@/lib/auth/session";
import type { AuthResponse, LoginPayload, RegisterPayload } from "./types";

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function register(payload: RegisterPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logout(): Promise<void> {
  const token = getAccessToken();
  const refreshToken = getRefreshToken();
  try {
    if (token && refreshToken) {
      await apiRequest("/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    }
  } catch {
    // Revoking on the server is best effort; always clear the local session.
  } finally {
    clearSession();
    clearApiCache();
  }
}

export function getCurrentUser(): Promise<AuthResponse["user"]> {
  const token = getAccessToken();
  return apiRequest<AuthResponse["user"]>("/users/me", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export function updateProfile(name: string): Promise<AuthResponse["user"]> {
  const token = getAccessToken();
  return apiRequest<AuthResponse["user"]>("/users/me", {
    method: "PATCH",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify({ name }),
  });
}
