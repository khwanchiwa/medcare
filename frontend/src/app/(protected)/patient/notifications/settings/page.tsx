"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, PageTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TablerIcon } from "@/components/ui/tabler-icons";
import {
  getNotificationPreferences, saveNotificationPreferences,
  type NotificationPreferences,
} from "@/features/notifications/api";
import { ApiError } from "@/lib/api-client";

const defaults: NotificationPreferences = {
  medication_lead_minutes: 0, appointment_lead_minutes: [1440, 120], line_enabled: true,
};

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState(defaults);
  const [appointmentLeads, setAppointmentLeads] = useState("1440, 120");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void getNotificationPreferences().then((value) => {
      setPreferences(value); setAppointmentLeads(value.appointment_lead_minutes.join(", "));
    }).catch((caught: unknown) => setError(caught instanceof ApiError ? caught.message : "โหลดการตั้งค่าไม่สำเร็จ"));
  }, []);

  async function save(): Promise<void> {
    const leads = appointmentLeads.split(",").map(Number).filter(Number.isFinite);
    if (!leads.length || leads.some((value) => value < 0 || value > 43200)) {
      setError("กรุณาระบุนาทีล่วงหน้าระหว่าง 0 ถึง 43,200 โดยคั่นด้วยจุลภาค"); return;
    }
    setBusy(true); setError(""); setMessage("");
    try {
      const saved = await saveNotificationPreferences({ ...preferences, appointment_lead_minutes: leads });
      setPreferences(saved); setAppointmentLeads(saved.appointment_lead_minutes.join(", "));
      setMessage("บันทึกการตั้งค่าการแจ้งเตือนแล้ว");
    } catch (caught) { setError(caught instanceof ApiError ? caught.message : "บันทึกไม่สำเร็จ"); }
    finally { setBusy(false); }
  }

  return <><PageTitle title="ตั้งค่าการแจ้งเตือน" subtitle="กำหนดเวลาแจ้งเตือนผ่าน LINE โดยไม่ต้องเปิดหน้าเว็บ" />
    <Card><div className="grid gap-5">
      <label className="flex items-center gap-3 font-semibold text-slate-800">
        <input type="checkbox" className="h-5 w-5" checked={preferences.line_enabled}
          onChange={(event) => setPreferences((value) => ({ ...value, line_enabled: event.target.checked }))} />
        เปิดการแจ้งเตือนผ่าน LINE
      </label>
      <Input label="แจ้งเตือนยาล่วงหน้า (นาที)" type="number" min={0} max={1440}
        value={preferences.medication_lead_minutes}
        onChange={(event) => setPreferences((value) => ({ ...value, medication_lead_minutes: Number(event.target.value) }))}
        hint="ใช้ 0 เพื่อแจ้งเมื่อถึงเวลา หรือ 15 เพื่อแจ้งก่อน 15 นาที" />
      <Input label="แจ้งเตือนนัดหมายล่วงหน้า (นาที)" value={appointmentLeads}
        onChange={(event) => setAppointmentLeads(event.target.value)}
        hint="คั่นหลายช่วงด้วยจุลภาค เช่น 1440, 120 คือก่อน 1 วันและ 2 ชั่วโมง" />
      {message ? <p className="rounded-xl bg-emerald-50 p-3 text-emerald-800">{message}</p> : null}
      {error ? <p className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p> : null}
      <Button disabled={busy} icon={<TablerIcon name="check" />} onClick={() => void save()}>บันทึกการตั้งค่าการแจ้งเตือน</Button>
    </div></Card></>;
}
