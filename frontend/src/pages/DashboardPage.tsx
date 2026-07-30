import { useEffect, useMemo, useState } from "react";
import { createJob, deleteJob, listMyJobs, updateJob, type Job } from "../api/jobs";
import { useAuth } from "../context/AuthContext";
import { DashboardSkeleton } from "../components/Skeletons";
import api from "../api/client";

const blankJob = { title: "", company: "", location: "", description: "" };

type RecruiterApplication = {
  id: number;
  user_id: number;
  job_id: number;
  resume_text: string;
  status: string;
  created_at: string;
  job_title?: string;
  applicant_email?: string;
};

const VALID_STATUSES = ["applied", "reviewing", "interview", "offer", "rejected"];

const badgeColor: Record<string, string> = {
  applied: "bg-slate-100 text-slate-700",
  reviewing: "bg-amber-100 text-amber-700",
  interview: "bg-blue-100 text-blue-700",
  offer: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<RecruiterApplication[]>([]);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [expandedApp, setExpandedApp] = useState<number | null>(null);
  const [form, setForm] = useState(blankJob);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const recruiterMode = user?.role === "recruiter" || user?.role === "admin";

  const refresh = async () => {
    const jobList = await listMyJobs({ limit: 50 });
    setJobs(jobList);
    if (selectedJob) {
      const res = await api.get<RecruiterApplication[]>("/applications/job/" + selectedJob);
      setApplications(res.data);
    }
  };

  useEffect(() => {
    listMyJobs({ limit: 50 })
      .then(setJobs)
      .catch(() => setError("Unable to load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  const loadApplications = async (jobId: number) => {
    setSelectedJob(jobId);
    const res = await api.get<RecruiterApplication[]>("/applications/job/" + jobId);
    setApplications(res.data);
  };

  const updateStatus = async (appId: number, status: string) => {
    await api.patch("/applications/" + appId + "/status", { status });
    if (selectedJob) {
      const res = await api.get<RecruiterApplication[]>("/applications/job/" + selectedJob);
      setApplications(res.data);
    }
  };

  if (loading) {
    return (
      <div className="page-shell">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><DashboardSkeleton /></div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
          <p className="mt-2 text-slate-600">Manage your job postings and review applications.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card p-5 text-center">
            <div className="text-3xl font-bold text-slate-900">{jobs.length}</div>
            <div className="text-sm text-slate-500 mt-1">Active Postings</div>
          </div>
          <div className="card p-5 text-center">
            <div className="text-3xl font-bold text-slate-900">{applications.length}</div>
            <div className="text-sm text-slate-500 mt-1">Applications {selectedJob ? "for selected job" : ""}</div>
          </div>
          <div className="card p-5 text-center">
            <div className="text-3xl font-bold text-slate-900">
              {applications.filter(a => a.status === "reviewing" || a.status === "interview").length}
            </div>
            <div className="text-sm text-slate-500 mt-1">In Review</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6 space-y-4">
            <h2 className="text-xl font-semibold">{editingId ? "Edit Job" : "Create Job"}</h2>
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
            <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} disabled={!recruiterMode} />
            <input className="input" placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} disabled={!recruiterMode} />
            <input className="input" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} disabled={!recruiterMode} />
            <textarea className="input min-h-32" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={!recruiterMode} />
            <div className="flex gap-3">
              <button
                className="button-primary flex-1 disabled:opacity-60"
                disabled={!recruiterMode || saving}
                onClick={async () => {
                  setError(""); setMessage(""); setSaving(true);
                  try {
                    if (editingId) { await updateJob(editingId, form); setMessage("Job updated."); }
                    else { await createJob(form); setMessage("Job created."); }
                    setForm(blankJob); setEditingId(null);
                    await refresh();
                  } catch { setError("Unable to save job."); }
                  finally { setSaving(false); }
                }}
              >
                {saving ? "Saving..." : editingId ? "Update Job" : "Create Job"}
              </button>
              {editingId && (
                <button className="button-secondary" onClick={() => { setEditingId(null); setForm(blankJob); }}>Cancel</button>
              )}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">My Job Postings</h2>
              <span className="text-sm text-slate-500">{jobs.length} posting{jobs.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
              {jobs.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No jobs yet. Create your first posting.</div>
              ) : jobs.map((job) => (
                <div key={job.id} className={"p-4 " + (selectedJob === job.id ? "bg-brand-50" : "")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">{job.title}</div>
                      <div className="text-xs text-slate-500">{job.company} &middot; {job.location}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        className="button-secondary text-xs px-2 py-1"
                        onClick={() => loadApplications(job.id)}
                      >
                        Applications
                      </button>
                      <button
                        className="button-secondary text-xs px-2 py-1"
                        onClick={() => { setEditingId(job.id); setForm({ title: job.title, company: job.company, location: job.location, description: job.description }); }}
                        disabled={!recruiterMode}
                      >
                        Edit
                      </button>
                      <button
                        className="button-secondary text-xs px-2 py-1 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={async () => { await deleteJob(job.id); await refresh(); }}
                        disabled={!recruiterMode}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {selectedJob && (
          <div className="card overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-semibold">
                Applications for {jobs.find(j => j.id === selectedJob)?.title || "Job #" + selectedJob}
              </h2>
            </div>
            {applications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No applications yet for this posting.</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {applications.map((app) => (
                  <div key={app.id} className="p-6 space-y-3">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="font-medium text-slate-900">{app.applicant_email || "Applicant #" + app.user_id}</div>
                        <div className="text-xs text-slate-400 mt-0.5">Applied {new Date(app.created_at).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={"badge " + (badgeColor[app.status] || "bg-slate-100 text-slate-700")}>{app.status}</span>
                        <select
                          className="input w-auto text-sm py-1"
                          value={app.status}
                          onChange={(e) => updateStatus(app.id, e.target.value)}
                        >
                          {VALID_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <button
                      className="text-sm text-brand-600 hover:underline"
                      onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                    >
                      {expandedApp === app.id ? "Hide application" : "View application"}
                    </button>
                    {expandedApp === app.id && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
                        {app.resume_text}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
