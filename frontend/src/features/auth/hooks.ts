"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getCurrentUser } from "@/features/auth/api";
import { clearSession, getAccessToken, getStoredUser, updateStoredUser } from "@/lib/auth/session";
import type { AuthUser } from "./types";

export function useAuthUser(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let isMounted = true;
    const storedUser = getStoredUser();
    if (storedUser) {
      queueMicrotask(() => {
        if (isMounted) setUser(storedUser);
      });
    }

    async function syncUser() {
      if (!getAccessToken()) return;
      try {
        const currentUser = await getCurrentUser();
        if (!isMounted) return;
        updateStoredUser(currentUser);
        setUser(currentUser);
      } catch {
        // api-client handles expired sessions by redirecting to login.
      }
    }

    function handleUserUpdated(event: Event) {
      setUser((event as CustomEvent<AuthUser>).detail);
    }

    window.addEventListener("medcare-user-updated", handleUserUpdated);
    void syncUser();

    return () => {
      isMounted = false;
      window.removeEventListener("medcare-user-updated", handleUserUpdated);
    };
  }, []);

  return user;
}

export function useAuthGuard(expectedRole: "PATIENT" | "CAREGIVER"): void {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const token = getAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    const cachedUser = getStoredUser();
    if (cachedUser?.role === expectedRole) {
      void getCurrentUser().then((currentUser) => {
        if (!isMounted) return;
        updateStoredUser(currentUser);
        if (currentUser.role !== expectedRole) {
          router.replace(currentUser.role === "CAREGIVER" ? "/caregiver/dashboard" : "/patient/dashboard");
        }
      }).catch(() => {
        if (!isMounted) return;
        clearSession();
        router.replace("/login");
      });
      return () => {
        isMounted = false;
      };
    }

    void getCurrentUser().then((user) => {
      if (!isMounted) return;
      updateStoredUser(user);
      if (user.role !== expectedRole) {
        router.replace(user.role === "CAREGIVER" ? "/caregiver/dashboard" : "/patient/dashboard");
      }
    }).catch(() => {
      if (!isMounted) return;
      clearSession();
      router.replace("/login");
    });

    return () => {
      isMounted = false;
    };
  }, [expectedRole, router]);
}
