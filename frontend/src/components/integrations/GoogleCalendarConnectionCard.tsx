"use client";

import { useCallback, useEffect, useState } from "react";
import {
  disconnectGoogle,
  getGoogleAuthUrl,
  getGoogleStatus,
  syncGoogleCalendar,
  type IntegrationStatus,
} from "@/features/integrations/api";
import { ApiError } from "@/lib/api-client";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { TablerIcon } from "../ui/tabler-icons";

const callbackMessages: Record<string, { tone: "success" | "error"; text: string }> = {
  connected: { tone: "success", text: "เชื่อมต่อ Google Calendar สำเร็จ" },
  cancelled: { tone: "error", text: "ยกเลิกการอนุญาต Google Calendar" },
  invalid_state: { tone: "error", text: "คำขอเชื่อมต่อหมดอายุ กรุณาลองใหม่" },
  invalid_callback: { tone: "error", text: "ข้อมูลตอบกลับจาก Google ไม่ครบถ้วน กรุณาลองใหม่" },
  failed: { tone: "error", text: "เชื่อมต่อ Google Calendar ไม่สำเร็จ กรุณาลองใหม่" },
};

function formatDateTime(value: string | null): string {
  if (!value) return "ยังไม่เคยซิงค์";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function GoogleCalendarConnectionCard() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      setStatus(await getGoogleStatus());
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "โหลดสถานะ Google Calendar ไม่สำเร็จ");
    }
  }, []);

  useEffect(() => {
    const callback = new URLSearchParams(window.location.search).get("google");
    if (callback && callbackMessages[callback]) {
      const message = callbackMessages[callback];
      window.setTimeout(() => {
        if (message.tone === "success") setSuccess(message.text);
        else setError(message.text);
      }, 0);
      window.history.replaceState({}, "", window.location.pathname);
    }
    const refreshId = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(refreshId);
  }, [refresh]);

  async function connect(): Promise<void> {
    setBusy(true);
    setError("");
    try {
      const { url } = await getGoogleAuthUrl();
      window.location.assign(url);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "เชื่อมต่อไม่สำเร็จ");
      setBusy(false);
    }
  }

  async function sync(): Promise<void> {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await syncGoogleCalendar();
      setSuccess(`${result.message} (สร้าง ${result.created}, อัปเดต ${result.updated}, ลบ ${result.deleted}, ไม่เปลี่ยนแปลง ${result.unchanged})`);
      if (result.failed) setError(`มี ${result.failed} รายการที่ซิงค์ไม่สำเร็จ กรุณาลองอีกครั้ง`);
      await refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "ซิงค์ Google Calendar ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect(): Promise<void> {
    setBusy(true);
    setError("");
    try {
      const result = await disconnectGoogle();
      setSuccess(result.message);
      await refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "ยกเลิกการเชื่อมต่อไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  const statusText = status?.reconnect_required
    ? "ต้องเชื่อมต่อใหม่"
    : status?.connected ? "เชื่อมต่อแล้ว" : "ยังไม่เชื่อมต่อ";

  return (
    <Card>
      <div className="grid gap-4">
        <div className="flex justify-between gap-3">
          <h3 className="font-serifThai text-2xl font-semibold text-navy-900">Google Calendar</h3>
          <Badge tone={status?.connected ? "success" : "warning"}>{statusText}</Badge>
        </div>
        <p className="text-slate-600">ซิงค์นัดหมายจาก MedCare ไปยัง Google Calendar โดยข้อมูลใน MedCare เป็นข้อมูลหลักเสมอ</p>
        {!status ? <p className="text-slate-500">กำลังโหลดสถานะ...</p> : null}
        {status?.connected ? <p><span className="font-semibold">บัญชี Google:</span> {status.google_email ?? "Google ไม่เปิดเผยอีเมลสำหรับสิทธิ์ Calendar Events เท่านั้น"}</p> : null}
        {status?.connected ? <p><span className="font-semibold">ซิงค์ล่าสุด:</span> {formatDateTime(status.last_sync)}</p> : null}
        {status && !status.configured ? <p className="text-red-700">กรุณาตั้งค่า Google OAuth และ Token Encryption Key บน Backend ก่อน</p> : null}
        {success ? <p className="rounded-xl bg-emerald-50 p-3 text-emerald-800">{success}</p> : null}
        {error ? <p className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          {!status?.connected ? (
            <Button disabled={busy || !status?.configured} icon={<TablerIcon name="calendar-time" />} onClick={() => void connect()}>
              {status?.reconnect_required ? "เชื่อมต่อ Google Calendar ใหม่" : "เชื่อมต่อ Google Calendar"}
            </Button>
          ) : (
            <>
              <Button disabled={busy} icon={<TablerIcon name="refresh" />} onClick={() => void sync()}>Sync Google Calendar</Button>
              <Button disabled={busy} icon={<TablerIcon name="x" />} onClick={() => void disconnect()} variant="danger">ยกเลิกการเชื่อมต่อ</Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
