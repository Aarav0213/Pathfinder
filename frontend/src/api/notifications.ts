import api from "./client";

export type Notification = {
  id: number;
  user_id: number;
  title: string;
  message: string;
  read: number;
  created_at: string;
};

export async function getNotifications() {
  const res = await api.get<Notification[]>("/notifications");
  return res.data;
}

export async function markRead(id: number) {
  await api.post("/notifications/" + id + "/read");
}

export async function markAllRead() {
  await api.post("/notifications/read-all");
}
