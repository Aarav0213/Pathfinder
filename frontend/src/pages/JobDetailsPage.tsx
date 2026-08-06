import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { applyToJob, getJob, type Job } from "../api/jobs";
import { saveJob, unsaveJob, getSavedJobs } from "../api/saved";
import { JobDetailSkeleton } from "../components/Skeletons";
import { useAuth } from "../context/AuthContext";

export default function JobDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getJob(Number(id)), getSavedJobs()])
      .then(([jobData, savedData]) => {
        setJob(jobData);
        setSaved(savedData.some((s) => s.job_id === Number(id)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="page-shell"><div className="mx-auto max-w-5xl px-4 py-8"><JobDetailSkeleton /></div></div>;
  }
  if (!job) {
    return <div className="page-shell p-10"><div className="card p-8 text-center text-slate-600">Job not found.</div></div>;
  }

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <button className="text-sm text-slate-500 hover:text-slate-800" onClick={() => navigate(-1)}>
          &larr; Back to jobs
        </button>
        <div className="card p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
              <p className="mt-1 text-lg text-slate-600">{job.company} &middot; {job.location}</p>
            </div>
            {user && (
              <button
                className={"button-secondary " + (saved ? "border-brand-400 text-brand-600" : "")}
                onClick={async () => {
                  const wasSaved = saved;
                  setSaved(!wasSaved); // Optimistic UI
                  try {
                    if (wasSaved) { await unsaveJob(job.id); }
                    else { await saveJob(job.id); }
                  } catch (e) {
                    setSaved(wasSaved); // Revert on failure
                  }
                }}
              >
                {saved ? "Saved" : "Save Job"}
              </button>
            )}
          </div>
          <hr className="my-6 border-slate-200" />
          <h2 className="text-lg font-semibold text-slate-800 mb-2">About this role</h2>
          <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{job.description}</p>
        </div>
      </div>
    </div>
  );
}
