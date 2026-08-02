import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createCustomApplication, listMyApplications, type Application } from "../api/applications";
import { getApplicationAnalytics, type ApplicationAnalytics } from "../api/analytics";
import { ApplicationsSkeleton } from "../components/Skeletons";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";

const badgeColor: Record<string, string> = {
  applied: "bg-slate-100 text-slate-700",
  reviewing: "bg-amber-100 text-amber-700",
  interview: "bg-blue-100 text-blue-700",
  offer: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  accepted: "bg-emerald-100 text-emerald-700",
};

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [analytics, setAnalytics] = useState<ApplicationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [savingCustom, setSavingCustom] = useState(false);
  const [customError, setCustomError] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    apply_url: "",
    description: "",
  });

  const isPremium = Boolean((user as any)?.is_premium);

  async function refreshApplications() {
    const [apps, stats] = await Promise.all([listMyApplications(), getApplicationAnalytics()]);
    setApplications(apps);
    setAnalytics(stats);
  }

  useEffect(() => {
    refreshApplications().finally(() => setLoading(false));
  }, []);

  async function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavingCustom(true);
    setCustomError("");
    setAiResult("");

    try {
      const created = await createCustomApplication(form);
      await refreshApplications();

      if (isPremium) {
        const res = await api.post("/ai/generate", {
          job_id: created.job_id,
          type: "tailor_resume",
        });
        setAiResult(res.data.result);
      } else {
        setAiResult("Application saved. Upgrade to Pro to generate tailored resume guidance for pasted job descriptions.");
      }
    } catch (err: any) {
      setCustomError(err?.response?.data?.detail || "Unable to save this job. Please check the fields and try again.");
    } finally {
      setSavingCustom(false);
    }
  }

  function closeModal() {
    setShowCustomModal(false);
    setCustomError("");
    setAiResult("");
    setForm({ title: "", company: "", location: "", apply_url: "", description: "" });
  }

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Applications</h1>
            <p className="mt-2 text-slate-600">Track where you have applied and monitor your progress.</p>
          </div>

          <button
            onClick={() => setShowCustomModal(true)}
            className="inline-flex items-center justify-center rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            <span className="mr-2 text-lg leading-none">+</span>
            Add custom job
          </button>
        </div>

        {analytics && (
          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
            {[
              ["Total", analytics.total, "text-slate-700"],
              ["Applied", analytics.applied, "text-slate-700"],
              ["Reviewing", analytics.reviewing, "text-amber-700"],
              ["Interview", analytics.interview, "text-blue-700"],
              ["Offer", analytics.offer, "text-emerald-700"],
              ["Rejected", analytics.rejected, "text-red-700"],
            ].map(([label, value, color]) => (
              <div key={label as string} className="card p-4 text-center">
                <div className={"text-2xl font-bold " + color}>{value}</div>
                <div className="text-xs text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        )}

        {analytics && analytics.total > 0 && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Response Rate</span>
              <span className="text-sm font-bold text-slate-900">{analytics.response_rate}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: analytics.response_rate + "%" }} />
            </div>
            <p className="mt-2 text-xs text-slate-400">{analytics.response_rate}% of your applications received a response.</p>
          </div>
        )}

        <div className="card overflow-hidden">
          {loading ? <ApplicationsSkeleton /> : applications.length === 0 ? (
            <div className="p-10 text-center text-slate-600">No applications yet. Start by applying to a role you like or add a custom job.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-left text-sm text-slate-600">
                  <tr>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {applications.map((app) => (
                    <tr key={app.id} className="text-sm">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {(app as any).job_title || "Job #" + app.job_id}
                        {(app as any).job_company && <div className="text-xs text-slate-500 font-normal">{(app as any).job_company}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={"badge " + (badgeColor[app.status] || "bg-slate-100 text-slate-700")}>{app.status}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{new Date(app.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <Link className="text-brand-600 hover:underline" to={"/applications/" + app.id}>View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Add custom job</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Paste a job from LinkedIn or another site. Pro users get tailored resume guidance automatically.
                </p>
              </div>
              <button onClick={closeModal} className="rounded-full px-3 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleCustomSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Job title</span>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500"
                    placeholder="Software Engineering Intern"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Company</span>
                  <input
                    required
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500"
                    placeholder="LinkedIn, Google, Stripe..."
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Location</span>
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500"
                    placeholder="Remote, New York, Austin..."
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Apply URL</span>
                  <input
                    value={form.apply_url}
                    onChange={(e) => setForm({ ...form, apply_url: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500"
                    placeholder="https://..."
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Job description</span>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 min-h-56 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500"
                  placeholder="Paste the full job description here..."
                />
              </label>

              {customError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {customError}
                </div>
              )}

              {aiResult && (
                <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4">
                  <div className="mb-2 text-sm font-semibold text-brand-700">
                    {isPremium ? "Pro personalization" : "Saved"}
                  </div>
                  <pre className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{aiResult}</pre>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={savingCustom}
                  className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {savingCustom ? "Saving..." : isPremium ? "Save + personalize" : "Save application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
