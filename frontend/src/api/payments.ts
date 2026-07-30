import api from "./client";

export async function createCheckoutSession() {
  const res = await api.post<{ url: string }>("/payments/create-checkout", {
    success_url: window.location.origin + "/upgrade?success=true",
    cancel_url: window.location.origin + "/upgrade?canceled=true",
  });
  return res.data.url;
}

export async function confirmCheckoutSession(session_id: string) {
  const res = await api.post<{ ok: boolean; is_premium: number; stripe_customer_id: string }>("/payments/confirm-session", {
    session_id,
  });
  return res.data;
}

export async function createPortalSession() {
  const res = await api.post<{ url: string }>("/payments/create-portal");
  return res.data.url;
}
