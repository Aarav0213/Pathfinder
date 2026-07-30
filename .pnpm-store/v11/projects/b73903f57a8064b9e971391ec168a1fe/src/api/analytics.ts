import api from "./client";

export type ApplicationAnalytics = {
  total: number;
  applied: number;
  reviewing: number;
  interview: number;
  offer: number;
  rejected: number;
  response_rate: number;
};

export async function getApplicationAnalytics() {
  const res = await api.get<ApplicationAnalytics>("/applications/analytics");
  return res.data;
}
