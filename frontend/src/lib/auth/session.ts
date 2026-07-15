import type { AuthResponse, AuthUser } from "@/features/auth/types";

const ACCESS_TOKEN_KEY = "medcare_access_token";
const REFRESH_TOKEN_KEY = "medcare_refresh_token";
const USER_KEY = "medcare_user";

export function saveSession(session: AuthResponse): void {
  if (!session.access_token || !session.refresh_token) {
    throw new Error("Supabase did not return an active session");
  }
  localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function getAccessToken(): string | null {
  return typeof window === "undefined"
    ? null
    : localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(USER_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    clearSession();
    return null;
  }
}

export function updateStoredUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent<AuthUser>("medcare-user-updated", { detail: user }));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
