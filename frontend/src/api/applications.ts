import api from "./client";

export type Application = {
  id: number;
  user_id: number;
  job_id: number;
  resume_text: string;
  status: "applied" | "reviewing" | "interview" | "offer" | "rejected" | "accepted";
  created_at: string;
  job_title?: string;
  job_company?: string;
};

export type CustomApplicationPayload = {
  title: string;
  company: string;
  location: string;
  description: string;
  apply_url?: string;
};

export async function listMyApplications() {
  const response = await api.get<Application[]>("/applications/me");
  return response.data;
}

export async function getApplication(id: number) {
  const response = await api.get<Application>(`/applications/${id}`);
  return response.data;
}

export async function updateApplicationStatus(id: number, status: Application["status"]) {
  const response = await api.patch<Application>(`/applications/${id}/status`, { status });
  return response.data;
}

export async function createCustomApplication(payload: CustomApplicationPayload) {
  const response = await api.post<Application>("/applications/custom", payload);
  return response.data;
}
