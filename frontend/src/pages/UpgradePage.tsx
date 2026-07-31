import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createCheckoutSession, createPortalSession, confirmCheckoutSession } from "../api/payments";

export default function UpgradePage() {
  const { user, token, login } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";
  const sessionId = searchParams.get("session_id");
  const isPremium = Boolean((user as any)?.is_premium);

  useEffect(() => {
    async function confirmStripeUpgrade() {
      if (!success || !sessionId || !token || isPremium || confirmed) return;
      setConfirming(true);
      setError("");
      try {
        await confirmCheckoutSession(sessionId);
        await login(token);
        setConfirmed(true);
      } catch {
        setError("Payment succeeded, but Pro activation did not complete. Please refresh.");
      } finally {
        setConfirming(false);
      }
    }
    confirmStripeUpgrade();
  }, [success, sessionId, token, isPremium, confirmed, login]);

  const handleUpgrade = async () => {
    if (!user) { window.location.href = "/login"; return; }
    setLoading(true);
    setError("");
    try {
      const url = await createCheckoutSession();
      window.location.href = url;
    } catch {
      setError("Unable to start checkout. Please try again.");
      setLoading(false);
    }
  };

  const handleManage = async () => {
    setLoading(true);
    setError("");
    try {
      const url = await createPortalSession();
      window.location.href = url;
    } catch {
      setError("Unable to open billing portal.");
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 space-y-8">
        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-emerald-700 font-medium text-center">
            {confirming ? "Confirming your Pro access..." : isPremium || confirmed ? "Payment successful. You are now on Pathfinder Pro." : "Payment successful. Finalizing Pro access..."}
          </div>
        )}
        {canceled && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-amber-700 text-center">
            Checkout was canceled. No charge was made.
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-red-700 text-center">
            {error}
          </div>
        )}

        <div>
          <h1 className="text-4xl font-bold text-slate-900 text-center">Upgrade to Pro</h1>
          <p className="mt-3 text-lg text-slate-500 text-center">Everything you need to land your internship faster.</p>
        </div>

        <div className="card p-8 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["AI Cover Letters", "Generate tailored cover letters for any job with one click."],
              ["Resume Tailoring", "Rewrite your resume to match each job description automatically."],
              ["Company Watchlists", "Track companies and get notified when they post new roles."],
              ["Advanced Filters", "Filter by employment type, remote, date posted, and more."],
              ["Priority Listings", "See the newest internships before other users."],
              ["Application Analytics", "Track your application success rate and response rate."],
            ].map(([title, desc]) => (
              <div key={title} className="flex gap-3">
                <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold">+</div>
                <div>
                  <div className="font-medium text-slate-900">{title}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">$10</span>
                <span className="text-lg font-normal text-slate-500">/ month</span>
              </div>
              <div className="text-sm text-slate-500 mt-1">Cancel anytime. No commitment.</div>
            </div>

            {isPremium || confirmed ? (
              <div className="flex flex-col items-end gap-2">
                <div className="badge bg-brand-100 text-brand-700 text-base px-6 py-3 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-brand-500"></span>
                  You are on Pro
                </div>
                <button className="text-sm text-slate-500 hover:text-slate-800 underline" onClick={handleManage} disabled={loading}>
                  Manage subscription
                </button>
              </div>
            ) : (
              <button
                className="button-primary bg-slate-200 text-slate-700 hover:bg-slate-300 px-8 py-4 text-lg disabled:opacity-60 transition"
                onClick={handleUpgrade}
                disabled={loading || confirming}
              >
                {loading ? "Redirecting..." : confirming ? "Activating..." : "Get Pro Access"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
