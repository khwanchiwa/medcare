"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { TablerIcon } from "../ui/tabler-icons";

export function MedicationCheckIn({ medicationName, onTaken }: { medicationName: string; onTaken?: () => Promise<void> }) {
  const [done, setDone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="grid gap-2">
      <div>
        <Button
          disabled={done || isSaving}
          icon={<TablerIcon name="check" />}
          variant="success"
          full
          onClick={async () => {
            setIsSaving(true);
            setError("");
            try {
              await onTaken?.();
              setDone(true);
            } catch {
              setError("บันทึกไม่สำเร็จ");
            } finally {
              setIsSaving(false);
            }
          }}
        >
          {done ? "ทานแล้ว" : isSaving ? "กำลังบันทึก..." : "ทานยาแล้ว"}
          <span className="sr-only"> {medicationName}</span>
        </Button>
      </div>
      {error ? <p className="text-center text-xs font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
