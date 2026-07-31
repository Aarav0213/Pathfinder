import api from "./client";

export type WatchlistEntry = {
  id: number;
  user_id: number;
  company: string;
  created_at: string;
};

export async function getWatchlist() {
  const res = await api.get<WatchlistEntry[]>("/watchlist");
  return res.data;
}

export async function addToWatchlist(company: string) {
  const res = await api.post<WatchlistEntry>("/watchlist", { company });
  return res.data;
}

export async function removeFromWatchlist(id: number) {
  const res = await api.delete("/watchlist/" + id);
  return res.data;
}

