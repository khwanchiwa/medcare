"use client";
import { useCallback, useEffect, useState } from "react";
import { disconnectGoogle, getGoogleAuthUrl, getGoogleStatus, type IntegrationStatus } from "@/features/integrations/api";
import { ApiError } from "@/lib/api-client";
import { Badge } from "../ui/badge"; import { Button } from "../ui/button"; import { Card } from "../ui/card"; import { TablerIcon } from "../ui/tabler-icons";
export function GoogleCalendarConnectionCard() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => { try { setStatus(await getGoogleStatus()); } catch (e) { setError(e instanceof ApiError ? e.message : "โหลดสถานะ Google ไม่สำเร็จ"); } }, []);
  useEffect(() => { const id = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(id); }, [refresh]);
  async function connect() { setBusy(true); try { const { url } = await getGoogleAuthUrl(); window.location.assign(url); } catch (e) { setError(e instanceof ApiError ? e.message : "เชื่อมต่อไม่สำเร็จ"); setBusy(false); } }
  async function disconnect() { setBusy(true); try { await disconnectGoogle(); await refresh(); } catch (e) { setError(e instanceof ApiError ? e.message : "ยกเลิกไม่สำเร็จ"); } finally { setBusy(false); } }
  return <Card><div className="grid gap-4"><div className="flex justify-between gap-3"><h3 className="font-serifThai text-2xl font-semibold text-navy-900">Google Calendar</h3><Badge tone={status?.connected ? "success" : "warning"}>{status?.connected ? "เชื่อมต่อแล้ว" : "ยังไม่เชื่อมต่อ"}</Badge></div><p className="text-slate-600">สร้าง แก้ไข และลบ Event อัตโนมัติจากนัดหมายใน MedCare</p>{status && !status.configured ? <p className="text-red-700">กรุณาตั้งค่า Google OAuth ใน Backend ก่อน</p> : null}{error ? <p className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p> : null}{!status?.connected ? <Button disabled={busy || !status?.configured} icon={<TablerIcon name="calendar-time" />} onClick={() => void connect()}>เชื่อมต่อ Google Calendar</Button> : <Button disabled={busy} icon={<TablerIcon name="x" />} onClick={() => void disconnect()} variant="danger">ยกเลิกการเชื่อมต่อ</Button>}</div></Card>;
}
