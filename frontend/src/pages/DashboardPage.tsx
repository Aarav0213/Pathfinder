import { useEffect, useMemo, useState } from "react";
import { createJob, deleteJob, listJobs, updateJob, type Job } from "../api/jobs";
import { listMyApplications, updateApplicationStatus, type Application } from "../api/applications";
import { useAuth } from "../context/AuthContext";
import { DashboardSkeleton } from "../components/Skeletons";
import { isProUser } from "../services/billingService";

const blankJob = { title: "", company: "", location: "", description: "" };

export default function DashboardPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [form, setForm] = useState(blankJob);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const recruiterMode = user?.role === "recruiter" || user?.role === "admin" || isProUser();

  const refresh = async () => {
    const [jobList, appList] = await Promise.all([listJobs({ limit: 50 }), listMyApplications().catch(() => [])]);
    setJobs(jobList);
    setApplications(appList);
  };

  useEffect(() => {
    refresh()
      .catch(() => setError("Unable to load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  const statusSummary = useMemo(() => {
    return applications.reduce(
      (acc, application) => {
        acc.total += 1;
        acc[application.status] += 1;
        return acc;
      },
      { total: 0, applied: 0, reviewing: 0, rejected: 0, accepted: 0 },
    );
  }, [applications]);

  const activeJobCount = jobs.length;

  if (loading) {
    return (
      <div className="page-shell">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-slate-600">
          {recruiterMode ? "Recruiter workspace with posting and review tools." : "Track your applications and upgrade when you're ready to post jobs."}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="card p-5">
            <div className="text-sm text-slate-500">Total jobs applied</div>
            <div className="mt-2 text-3xl font-bold">{statusSummary.total}</div>
          </div>
          <div className="card p-5">
            <div className="text-sm text-slate-500">Applied</div>
            <div className="mt-2 text-3xl font-bold">{statusSummary.applied}</div>
          </div>
          <div className="card p-5">
            <div className="text-sm text-slate-500">Reviewing</div>
            <div className="mt-2 text-3xl font-bold">{statusSummary.reviewing}</div>
          </div>
          <div className="card p-5">
            <div className="text-sm text-slate-500">Active postings</div>
            <div className="mt-2 text-3xl font-bold">{activeJobCount}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">{editingId ? "Edit Job" : "Create Job"}</h2>
              {!recruiterMode ? <span className="badge bg-slate-100 text-slate-700">Posting locked on Free</span> : null}
            </div>
            <div className="mt-4 space-y-4">
              {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
              {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
              <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} disabled={!recruiterMode} />
              <input className="input" placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} disabled={!recruiterMode} />
              <input className="input" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} disabled={!recruiterMode} />
              <textarea className="input min-h-40" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={!recruiterMode} />
              <button
                className="button-primary disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!recruiterMode || saving}
                onClick={async () => {
                  setError("");
                  setMessage("");
                  setSaving(true);
                  const tempId = Date.now();
                  const optimisticJob: Job = {
                    id: tempId,
                    title: form.title,
                    company: form.company,
                    location: form.location,
                    description: form.description,
                    posted_at: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  };

                  const previousJobs = jobs;
                  if (!editingId) {
                    setJobs((current) => [optimisticJob, ...current]);
                  }

                  try {
                    if (editingId) {
                      await updateJob(editingId, form);
                      setMessage("Job updated.");
                    } else {
                      await createJob(form);
                      setMessage("Job created.");
                    }
                    setForm(blankJob);
                    setEditingId(null);
                    await refresh();
                  } catch {
                    setJobs(previousJobs);
                    setError("Unable to save job.");
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Saving..." : editingId ? "Update Job" : "Create Job"}
              </button>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-slate-200 p-6">
              <h2 className="text-xl font-semibold">Applications</h2>
            </div>
            <div className="max-h-[640px] overflow-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-left text-sm text-slate-600">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Job</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {applications.length === 0 ? (
                    <tr>
                      <td className="px-6 py-8 text-center text-slate-600" colSpan={4}>
                        No applications yet. Start by applying to a role.
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => (
                      <tr key={app.id} className="text-sm">
                        <td className="px-6 py-4">{app.id}</td>
                        <td className="px-6 py-4">Job #{app.job_id}</td>
                        <td className="px-6 py-4">{app.status}</td>
                        <td className="px-6 py-4">
                          <button
                            className="button-secondary disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={async () => {
                              const next = app.status === "applied" ? "reviewing" : "accepted";
                              await updateApplicationStatus(app.id, next);
                              await refresh();
                            }}
                          >
                            Advance
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-6 card overflow-hidden">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Existing Jobs</h2>
              <div className="text-sm text-slate-500">
                {recruiterMode ? "Recruiter tools enabled" : "Upgrade to post jobs"}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 text-left text-sm text-slate-600">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {jobs.length === 0 ? (
                  <tr>
                    <td className="px-6 py-8 text-center text-slate-600" colSpan={4}>
                      No jobs found. Create your first opening.
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="text-sm">
                      <td className="px-6 py-4 font-medium">{job.title}</td>
                      <td className="px-6 py-4">{job.company}</td>
                      <td className="px-6 py-4">{job.location}</td>
                      <td className="px-6 py-4 space-x-2">
                        <button
                          className="button-secondary disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={() => {
                            setEditingId(job.id);
                            setForm({ title: job.title, company: job.company, location: job.location, description: job.description });
                          }}
                          disabled={!recruiterMode}
                        >
                          Edit
                        </button>
                        <button
                          className="button-secondary disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={async () => {
                            await deleteJob(job.id);
                            await refresh();
                          }}
                          disabled={!recruiterMode}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
