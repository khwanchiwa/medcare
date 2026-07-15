"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { disconnectLine, getLineAuthUrl, getLineStatus } from "@/features/integrations/line/api";
import type { LineIntegrationStatus } from "@/features/integrations/line/types";
import { ApiError } from "@/lib/api-client";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { TablerIcon } from "../ui/tabler-icons";

const callbackMessages: Record<string, { error: boolean; text: string }> = {
  connected: { error: false, text: "เชื่อมต่อบัญชี LINE สำเร็จ" },
  cancelled: { error: true, text: "ยกเลิกการอนุญาตบัญชี LINE" },
  invalid_state: { error: true, text: "คำขอเชื่อมต่อหมดอายุ กรุณาลองใหม่" },
  invalid_callback: { error: true, text: "ข้อมูลตอบกลับจาก LINE ไม่ครบถ้วน กรุณาลองใหม่" },
  failed: { error: true, text: "ยืนยันบัญชี LINE ไม่สำเร็จ กรุณาลองใหม่" },
};

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function LineConnectionCard() {
  const [status, setStatus] = useState<LineIntegrationStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const refresh = useCallback(async (): Promise<void> => {
    try { setStatus(await getLineStatus()); }
    catch (caught) { setError(caught instanceof ApiError ? caught.message : "โหลดสถานะ LINE ไม่สำเร็จ"); }
  }, []);

  useEffect(() => {
    const callback = new URLSearchParams(window.location.search).get("line");
    if (callback && callbackMessages[callback]) {
      const message = callbackMessages[callback];
      window.setTimeout(() => {
        if (message.error) setError(message.text); else setSuccess(message.text);
      }, 0);
      window.history.replaceState({}, "", window.location.pathname);
    }
    const refreshId = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(refreshId);
  }, [refresh]);

  async function connect(): Promise<void> {
    setBusy(true); setError("");
    try { window.location.assign((await getLineAuthUrl()).url); }
    catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "เชื่อมต่อ LINE ไม่สำเร็จ");
      setBusy(false);
    }
  }

  async function disconnect(): Promise<void> {
    setBusy(true); setError(""); setSuccess("");
    try { setSuccess((await disconnectLine()).message); await refresh(); }
    catch (caught) { setError(caught instanceof ApiError ? caught.message : "ยกเลิกการเชื่อมต่อไม่สำเร็จ"); }
    finally { setBusy(false); }
  }

  return <Card><div className="grid gap-4">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        {status?.picture_url ? <Image unoptimized width={48} height={48} className="h-12 w-12 rounded-full object-cover" src={status.picture_url} alt="LINE profile" /> : null}
        <div><h3 className="font-serifThai text-2xl font-semibold text-navy-900">LINE Official Account</h3>
          {status?.display_name ? <p className="text-sm text-slate-600">{status.display_name}</p> : null}</div>
      </div>
      <Badge tone={status?.connected ? "success" : "warning"}>{status?.connected ? "เชื่อมต่อแล้ว" : "ยังไม่เชื่อมต่อ"}</Badge>
    </div>
    <p className="text-slate-600">รับการแจ้งเตือนยาและนัดหมายจากข้อมูลของคุณใน MedCare ผ่าน LINE</p>
    {status?.connected ? <p><span className="font-semibold">เชื่อมต่อล่าสุด:</span> {formatDate(status.connected_at)}</p> : null}
    {status && !status.configured ? <p className="text-red-700">ระบบ LINE ยังไม่ได้ตั้งค่าบน Backend</p> : null}
    {success ? <p className="rounded-xl bg-emerald-50 p-3 text-emerald-800">{success}</p> : null}
    {error ? <p className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p> : null}
    <div>{status?.connected
      ? <Button disabled={busy} icon={<TablerIcon name="x" />} variant="danger" onClick={() => void disconnect()}>ยกเลิกการเชื่อมต่อ</Button>
      : <Button disabled={busy || !status?.configured} icon={<TablerIcon name="bell" />} onClick={() => void connect()}>เชื่อมต่อ LINE</Button>}
    </div>
  </div></Card>;
}
