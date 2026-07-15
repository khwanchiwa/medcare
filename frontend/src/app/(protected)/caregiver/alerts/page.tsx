"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, PageTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatNotificationDateTime,
  getNotificationStatus,
  listNotifications,
  notificationChannelLabels,
  type NotificationRecord,
} from "@/features/notifications/api";
import { ApiError } from "@/lib/api-client";

export default function CaregiverAlertsPage() {
  const [alerts, setAlerts] = useState<NotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listNotifications()
      .then(setAlerts)
      .catch((caughtError) => {
        setError(caughtError instanceof ApiError ? caughtError.message : "ไม่สามารถโหลดรายการแจ้งเตือนได้");
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <>
      <PageTitle title="รายการแจ้งเตือน" subtitle="แจ้งเตือนจริงของบัญชีผู้ดูแล เช่น ผู้ป่วยยังไม่กินยาและนัดหมายใกล้ถึง" />
      {isLoading ? <Skeleton label="กำลังโหลดรายการแจ้งเตือน" /> : null}
      {error ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-600">{error}</p> : null}
      {!isLoading && !error && !alerts.length ? (
        <Card className="mt-5 grid min-h-[160px] place-items-center text-center font-semibold text-slate-400">
          ยังไม่มีรายการแจ้งเตือน
        </Card>
      ) : null}
      <div className="grid gap-4">
        {alerts.map((alert) => {
          const status = getNotificationStatus(alert);
          return (
            <Card key={alert.id}>
              <div className="flex flex-wrap justify-between gap-3">
                <h2 className="font-serifThai text-2xl font-semibold text-navy-900">{alert.title}</h2>
                <Badge tone={status === "ส่งแล้ว" ? "success" : "warning"}>{status}</Badge>
              </div>
              <p className="mt-2 text-slate-600">{alert.message}</p>
              <p className="mt-3 font-mono text-slate-800">
                {notificationChannelLabels[alert.channel]} · {formatNotificationDateTime(alert.sent_at ?? alert.scheduled_at)}
              </p>
            </Card>
          );
        })}
      </div>
    </>
  );
}
