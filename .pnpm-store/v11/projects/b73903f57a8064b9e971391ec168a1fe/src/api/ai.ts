import api from "./client";

export async function generateAI(job_id: number, type: "cover_letter" | "tailor_resume") {
  const res = await api.post<{ result: string }>("/ai/generate", { job_id, type });
  return res.data.result;
}
