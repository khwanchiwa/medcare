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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listNotifications()
      .then(setNotifications)
      .catch((caughtError) => {
        setError(caughtError instanceof ApiError ? caughtError.message : "ไม่สามารถโหลดประวัติการแจ้งเตือนได้");
      })
      .finally(() => setIsLoading(false));
  }, []);

  return <>
    <PageTitle title="ประวัติการแจ้งเตือน" subtitle="รายการแจ้งเตือนในระบบและ Google Calendar" />
    {isLoading ? <Skeleton label="กำลังโหลดการแจ้งเตือน" /> : null}
    {error ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-600">{error}</p> : null}
    {!isLoading && !error && !notifications.length ? (
      <Card className="mt-5 grid min-h-[160px] place-items-center text-center font-semibold text-slate-400">
        ยังไม่มีประวัติการแจ้งเตือน
      </Card>
    ) : null}
    <div className="grid gap-4">
      {notifications.map((item) => {
        const status = getNotificationStatus(item);
        return (
          <Card key={item.id}>
            <div className="flex flex-wrap justify-between gap-3">
              <h3 className="text-2xl font-bold text-navy-900">{item.title}</h3>
              <Badge tone={status === "ส่งแล้ว" ? "success" : "warning"}>{status}</Badge>
            </div>
            <p className="mt-2 text-slate-600">{item.message}</p>
            <p className="mt-3 font-mono text-slate-800">
              {notificationChannelLabels[item.channel]} · {formatNotificationDateTime(item.sent_at ?? item.scheduled_at)}
            </p>
          </Card>
        );
      })}
    </div>
  </>;
}
