import api from "./client";

export type AuthUser = { id: number; email: string; role: "user" | "recruiter" | "admin" };

export async function register(email: string, password: string) {
  const response = await api.post<AuthUser>("/auth/register", { email, password });
  return response.data;
}

export async function login(email: string, password: string) {
  const response = await api.post<{ access_token: string; token_type: string }>("/auth/login", {
    email,
    password,
  });
  return response.data;
}

export async function getMe() {
  const response = await api.get<AuthUser>("/auth/me");
  return response.data;
}
