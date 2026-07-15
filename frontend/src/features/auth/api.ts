import { apiRequest } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth/session";
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
