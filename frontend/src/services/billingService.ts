export type Plan = "free" | "pro";

const PLAN_KEY = "billing_plan";

export function getPlan(): Plan {
  const plan = localStorage.getItem(PLAN_KEY);
  return plan === "pro" ? "pro" : "free";
}

export function upgradeToPro() {
  localStorage.setItem(PLAN_KEY, "pro");
}

export function isProUser() {
  return getPlan() === "pro";
}

export function resetBillingPlan() {
  localStorage.removeItem(PLAN_KEY);
}

