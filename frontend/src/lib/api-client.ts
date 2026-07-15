import { clearSession } from "@/lib/auth/session";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/backend";

type ApiRequestInit = RequestInit & {
  cacheTtlMs?: number;
};

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

const responseCache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<unknown>>();

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isExpiredSession(message: string, status: number): boolean {
  const normalizedMessage = message.toLowerCase();
  return status === 401 && (
    normalizedMessage.includes("invalid or expired supabase access token") ||
    normalizedMessage.includes("expired") ||
    normalizedMessage.includes("invalid token")
  );
}

function redirectToLoginForExpiredSession(): void {
  if (typeof window === "undefined") return;
  clearSession();
  clearApiCache();
  window.sessionStorage.setItem("medcare_login_notice", "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
  const loginPath = "/login";
  if (window.location.pathname !== "/login") {
    window.location.assign(loginPath);
  }
}

function authorizationValue(headers?: HeadersInit): string {
  if (!headers) return "anonymous";
  return new Headers(headers).get("Authorization") ?? "anonymous";
}

function requestCacheKey(path: string, headers?: HeadersInit): string {
  return `${path}:${authorizationValue(headers)}`;
}

export function clearApiCache(pathPrefix?: string): void {
  if (!pathPrefix) {
    responseCache.clear();
    pendingRequests.clear();
    return;
  }
  for (const key of responseCache.keys()) {
    if (key.startsWith(pathPrefix)) responseCache.delete(key);
  }
  for (const key of pendingRequests.keys()) {
    if (key.startsWith(pathPrefix)) pendingRequests.delete(key);
  }
}

export async function apiRequest<T>(
  path: string,
  init: ApiRequestInit = {},
): Promise<T> {
  const { cacheTtlMs = 0, ...fetchInit } = init;
  const method = (fetchInit.method ?? "GET").toUpperCase();
  const canCache = method === "GET" && cacheTtlMs > 0;
  const cacheKey = requestCacheKey(path, fetchInit.headers);

  if (canCache) {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value as T;
    if (cached) responseCache.delete(cacheKey);
    const pending = pendingRequests.get(cacheKey);
    if (pending) return pending as Promise<T>;
  }

  const request = performRequest<T>(path, fetchInit).then((value) => {
    if (canCache) {
      responseCache.set(cacheKey, { value, expiresAt: Date.now() + cacheTtlMs });
    }
    return value;
  }).finally(() => {
    if (canCache) pendingRequests.delete(cacheKey);
  });

  if (canCache) pendingRequests.set(cacheKey, request);
  return request;
}

async function performRequest<T>(path: string, init: RequestInit): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  const requestInit: RequestInit = {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...init.headers,
    },
  };
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, requestInit);
  } catch {
    throw new ApiError("ติดต่อ Backend ไม่ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์เปิดอยู่ที่พอร์ต 8000", 0);
  }

  if (!response.ok) {
    let message = "ไม่สามารถเชื่อมต่อกับระบบได้";
    try {
      const body = (await response.json()) as { detail?: string };
      message = body.detail ?? message;
    } catch {
      // Keep the user-friendly fallback for non-JSON server errors.
    }
    if (isExpiredSession(message, response.status)) {
      redirectToLoginForExpiredSession();
      throw new ApiError("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่", response.status);
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}
