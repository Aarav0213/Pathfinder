import api from "./client";

export type UserProfile = {
  id: number;
  email: string;
  role: string;
  is_premium: number;
  resume_text?: string;
  skills?: string;
  target_roles?: string;
  preferred_locations?: string;
  graduation_year?: number;
};

export async function getProfile() {
  const res = await api.get<UserProfile>("/users/me");
  return res.data;
}

export async function updateProfile(data: Partial<UserProfile>) {
  const res = await api.patch<UserProfile>("/users/me", data);
  return res.data;
}

