import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { applyToJob, getJob, type Job } from "../api/jobs";
import { JobDetailSkeleton } from "../components/Skeletons";

export default function JobDetailsPage() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [appliedOptimistic, setAppliedOptimistic] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getJob(Number(id))
      .then((data) => {
        setJob(data);
        setError("");
      })
      .catch(() => setError("Unable to load this job."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="page-shell">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <JobDetailSkeleton />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="page-shell p-10">
        <div className="card p-8 text-center text-slate-600">Job not found.</div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="card p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">{job.title}</h1>
              <p className="mt-2 text-slate-600">
                {job.company} · {job.location}
              </p>
              <p className="mt-6 whitespace-pre-wrap text-slate-700">{job.description}</p>
            </div>
          </div>
        </div>
        <div className="mt-6 card p-8">
          <h2 className="text-xl font-semibold">Apply now</h2>
          <div className="mt-4 space-y-4">
            {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
            <textarea
              className="input min-h-48"
              placeholder="Paste your resume summary here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              disabled={appliedOptimistic}
            />
            <button
              className="button-primary disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting || appliedOptimistic || resumeText.trim().length < 50}
              onClick={async () => {
                setError("");
                setMessage("");
                setSubmitting(true);
                setAppliedOptimistic(true);
                try {
                  await applyToJob(job.id, resumeText);
                  setMessage("Application submitted successfully.");
                  setResumeText("");
                } catch {
                  setAppliedOptimistic(false);
                  setError("Unable to submit application. Please log in and try again.");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {appliedOptimistic ? "Applied" : submitting ? "Submitting..." : "Apply"}
            </button>
            <p className="text-sm text-slate-500">Resume summary must be at least 50 characters.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
