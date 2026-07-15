import type { UserRole } from "@/features/auth/types";

export type RelationshipStatus = "pending" | "approved" | "declined" | "revoked";

export type RelationshipUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string | null;
  caregiver_name: string | null;
  date_of_birth: string | null;
  medical_conditions: string | null;
  timezone: string;
  is_active: boolean;
  created_at: string;
};

export type CaregiverRelationship = {
  id: string;
  patient_id: string;
  caregiver_id: string;
  relationship_label: string | null;
  status: RelationshipStatus;
  can_edit_medication: boolean;
  can_edit_appointment: boolean;
  can_view_history: boolean;
  created_at: string;
  patient: RelationshipUser;
  caregiver: RelationshipUser;
};

export type CaregiverInvitePayload = {
  caregiver_email: string;
  relationship_label?: string | null;
  can_edit_medication?: boolean;
  can_edit_appointment?: boolean;
  can_view_history?: boolean;
};
