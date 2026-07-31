import api from "./client";
import { type Job } from "./jobs";

export async function getRecommendations() {
  const res = await api.get<Job[]>("/recommendations");
  return res.data;
}

