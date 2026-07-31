import api from "./client";

export type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  posted_at: string;
  created_at: string;
  updated_at: string;
};

export type JobCreate = {
  title: string;
  company: string;
  location: string;
  description: string;
};

export type JobUpdate = JobCreate;

export async function listJobs(params?: any) {
  const response = await api.get<Job[]>("/jobs", { params });
  return response.data;
}

export async function listMyJobs(params?: any) {
  const response = await api.get<Job[]>("/jobs/mine", { params });
  return response.data;
}

export async function getJob(id: number) {
  const response = await api.get<Job>("/jobs/" + id);
  return response.data;
}

export async function createJob(job: JobCreate) {
  const response = await api.post<Job>("/jobs", job);
  return response.data;
}

export async function updateJob(id: number, payload: JobUpdate) {
  const response = await api.put<Job>("/jobs/" + id, payload);
  return response.data;
}

export async function deleteJob(id: number) {
  const response = await api.delete<Job>("/jobs/" + id);
  return response.data;
}

export async function applyToJob(id: number, resume_text: string) {
  const response = await api.post("/jobs/" + id + "/apply", { resume_text });
  return response.data;
}

