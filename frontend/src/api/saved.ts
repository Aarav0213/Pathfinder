import api from "./client";

export type SavedJob = {
  id: number;
  user_id: number;
  job_id: number;
  created_at: string;
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
    description: string;
    posted_at: string;
    created_at: string;
    updated_at: string;
    apply_url?: string;
    ai_tags?: string;
  };
};

export async function getSavedJobs() {
  const res = await api.get<SavedJob[]>("/saved");
  return res.data;
}

export async function saveJob(job_id: number) {
  const res = await api.post<SavedJob>("/saved/" + job_id);
  return res.data;
}

export async function unsaveJob(job_id: number) {
  const res = await api.delete("/saved/" + job_id);
  return res.data;
}

