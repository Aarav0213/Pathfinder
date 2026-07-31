import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSavedJobs, unsaveJob, type SavedJob } from "../api/saved";

export default function SavedJobsPage() {
  const [saved, setSaved] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = () =>
    getSavedJobs()
      .then(setSaved)
      .catch(() => setError("Unable to load saved jobs."))
      .finally(() => setLoading(false));

  useEffect(() => { refresh(); }, []);

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Saved Jobs</h1>
          <p className="mt-1 text-slate-500">Jobs you have bookmarked for later.</p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {loading ? (
          <div className="text-slate-500">Loading...</div>
        ) : saved.length === 0 ? (
          <div className="card p-10 text-center text-slate-500">
            No saved jobs yet. Browse <Link className="text-brand-600 underline" to="/jobs">listings</Link> and save ones you like.
          </div>
        ) : (
          <div className="grid gap-4">
            {saved.map((s) => (
              <article key={s.id} className="card p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-xl font-semibold text-slate-900">{s.job.title}</div>
                    <div className="mt-1 text-slate-600">{s.job.company} &middot; {s.job.location}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      Posted {new Date(s.job.posted_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-slate-600">{s.job.description}</p>
                    {s.job.ai_tags && (
                      <div className="mt-3 text-xs text-slate-500 whitespace-pre-line">{s.job.ai_tags}</div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link className="button-secondary whitespace-nowrap" to={"/jobs/" + s.job.id}>View details</Link>
                    <button
                      className="button-secondary whitespace-nowrap text-red-600 border-red-200 hover:bg-red-50"
                      onClick={async () => { await unsaveJob(s.job.id); refresh(); }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

