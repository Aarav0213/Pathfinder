import api from "./client";

export type Application = {
  id: number;
  user_id: number;
  job_id: number;
  resume_text: string;
  status: "applied" | "reviewing" | "rejected" | "accepted";
  created_at: string;
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
