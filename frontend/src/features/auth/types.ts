export type UserRole = "PATIENT" | "CAREGIVER" | "ADMIN";

export type AuthUser = {
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

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = LoginPayload & {
  name: string;
  role: "PATIENT" | "CAREGIVER";
  timezone?: string;
};

export type AuthResponse = {
  access_token: string | null;
  refresh_token: string | null;
  token_type: "bearer";
  user: AuthUser;
  email_confirmation_required: boolean;
};
