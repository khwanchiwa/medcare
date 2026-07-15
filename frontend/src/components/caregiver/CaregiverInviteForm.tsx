"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { inviteCaregiver } from "@/features/caregiver-relationship/api";
import { ApiError } from "@/lib/api-client";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { TablerIcon } from "../ui/tabler-icons";

export function CaregiverInviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  function getInviteErrorMessage(caught: unknown): string {
    if (caught instanceof ApiError) return caught.message;
    if (caught instanceof Error && caught.message) return caught.message;
    return "ไม่สามารถส่งคำเชิญได้ กรุณาตรวจสอบอีเมลผู้ดูแลอีกครั้ง";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSending(true);
    try {
      await inviteCaregiver({
        caregiver_email: email.trim().toLowerCase(),
        relationship_label: relationship.trim() || null,
        can_edit_medication: true,
        can_edit_appointment: true,
        can_view_history: true,
      });
      router.push("/patient/caregivers");
      router.refresh();
    } catch (caught) {
      setError(getInviteErrorMessage(caught));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Card>
      <form className="grid gap-5" onSubmit={handleSubmit}>
        <Input label="อีเมลผู้ดูแล" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="caregiver@example.com" required />
        <Input label="ความสัมพันธ์" value={relationship} onChange={(event) => setRelationship(event.target.value)} placeholder="เช่น ลูกสาว คู่สมรส ผู้ดูแลส่วนตัว" />
        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p> : null}
        <Button disabled={isSending} icon={<TablerIcon name="mail" />} type="submit">{isSending ? "กำลังส่งคำเชิญ..." : "ส่งคำเชิญผู้ดูแล"}</Button>
      </form>
    </Card>
  );
}
