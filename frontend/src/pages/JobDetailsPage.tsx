import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { applyToJob, getJob, type Job } from "../api/jobs";
import { saveJob, unsaveJob, getSavedJobs } from "../api/saved";
import { generateAI } from "../api/ai";
import { JobDetailSkeleton } from "../components/Skeletons";
import { useAuth } from "../context/AuthContext";

function AILoadingBar({ active }: { active: boolean }) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setProgress(100);
      return;
    }
    setProgress(0);
    let current = 0;
    intervalRef.current = window.setInterval(() => {
      current += current < 30 ? 8 : current < 60 ? 4 : current < 80 ? 2 : current < 90 ? 0.5 : 0.1;
      if (current >= 95) {
        current = 95;
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      setProgress(current);
    }, 300);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [active]);

  const labels = [
    { at: 0, text: "Reading job description..." },
    { at: 25, text: "Analyzing your resume..." },
    { at: 50, text: "Crafting response..." },
    { at: 75, text: "Polishing content..." },
    { at: 93, text: "Almost done..." },
  ];

  const label = [...labels].reverse().find((l) => progress >= l.at)?.text || "Thinking...";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{active ? label : "Complete"}</span>
        <span>{Math.min(Math.round(progress), 100)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={"h-full rounded-full transition-all duration-300 " + (active ? "bg-brand-600" : "bg-emerald-500")}
          style={{ width: Math.min(progress, 100) + "%" }}
        />
      </div>
    </div>
  );
}

export default function JobDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applied, setApplied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiLoading, setAiLoading] = useState<"cover_letter" | "tailor_resume" | null>(null);
  const [aiResult, setAiResult] = useState("");
  const [showBar, setShowBar] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getJob(Number(id)), getSavedJobs()])
      .then(([jobData, savedData]) => {
        setJob(jobData);
        setSaved(savedData.some((s) => s.job_id === Number(id)));
        setError("");
      })
      .catch(() => setError("Unable to load this job."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAI = async (type: "cover_letter" | "tailor_resume") => {
    if (!job) return;
    setAiLoading(type);
    setAiResult("");
    setShowBar(true);
    try {
      const result = await generateAI(job.id, type);
      setAiResult(result);
    } catch {
      setAiResult("Unable to generate. Make sure your resume is saved in your profile.");
    } finally {
      setAiLoading(null);
      setTimeout(() => setShowBar(false), 1200);
    }
  };

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

  const posted = new Date(job.posted_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const isPremium = (user as any)?.is_premium;

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
              <p className="mt-1 text-sm text-slate-400">Posted {posted}</p>
            </div>
            {user && (
              <button
                className={"button-secondary " + (saved ? "border-brand-400 text-brand-600" : "")}
                onClick={async () => {
                  if (saved) { await unsaveJob(job.id); setSaved(false); }
                  else { await saveJob(job.id); setSaved(true); }
                }}
              >
                {saved ? "Saved" : "Save Job"}
              </button>
            )}
          </div>

          {(job as any).ai_tags && (
            <div className="mt-4 flex flex-wrap gap-2">
              {(job as any).ai_tags.split("\n").filter(Boolean).map((tag: string, i: number) => (
                <span key={i} className="badge bg-slate-100 text-slate-600">{tag.replace(/^[*\-]\s*/, "")}</span>
              ))}
            </div>
          )}

          <hr className="my-6 border-slate-200" />
          <h2 className="text-lg font-semibold text-slate-800 mb-2">About this role</h2>
          <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{job.description}</p>

          {(job as any).apply_url && (
            <div className="mt-6">
              <a className="button-primary" href={(job as any).apply_url} target="_blank" rel="noreferrer">
                Apply on company site
              </a>
            </div>
          )}
        </div>

        {user && isPremium && (
          <div className="card p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">AI Tools</h2>
              <span className="badge bg-brand-100 text-brand-700">Pro</span>
            </div>
            <p className="text-sm text-slate-500">AI uses your saved resume from your profile. Make sure it is up to date.</p>
            <div className="flex gap-3 flex-wrap">
              <button
                className="button-secondary disabled:opacity-60"
                disabled={aiLoading !== null}
                onClick={() => handleAI("cover_letter")}
              >
                {aiLoading === "cover_letter" ? "Generating..." : "Generate Cover Letter"}
              </button>
              <button
                className="button-secondary disabled:opacity-60"
                disabled={aiLoading !== null}
                onClick={() => handleAI("tailor_resume")}
              >
                {aiLoading === "tailor_resume" ? "Generating..." : "Tailor Resume"}
              </button>
            </div>

            {showBar && <AILoadingBar active={aiLoading !== null} />}

            {aiResult && !aiLoading && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-700">Result</span>
                  <button
                    className="text-xs text-brand-600 hover:underline"
                    onClick={() => navigator.clipboard.writeText(aiResult)}
                  >
                    Copy to clipboard
                  </button>
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">{aiResult}</p>
              </div>
            )}
          </div>
        )}

        {user && !isPremium && (
          <div className="card p-6 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-900">Unlock AI Tools</div>
              <div className="text-sm text-slate-500 mt-1">Generate cover letters and tailored resumes with one click.</div>
            </div>
            <a href="/upgrade" className="button-primary whitespace-nowrap">Upgrade to Pro</a>
          </div>
        )}

        <div className="card p-8">
          <h2 className="text-xl font-semibold mb-1">Apply for this role</h2>
          <p className="text-sm text-slate-500 mb-6">Fill in your details below. Your application will be sent directly to the recruiter.</p>
          <div className="space-y-4">
            {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cover Letter</label>
              <textarea
                className="input min-h-32"
                placeholder="Tell the recruiter why you are a great fit for this role..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                disabled={applied}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Resume Summary</label>
              <textarea
                className="input min-h-48"
                placeholder="Paste your resume summary or key experience here (min 50 characters)..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                disabled={applied}
              />
              <p className="mt-1 text-xs text-slate-400">{resumeText.length} characters &mdash; minimum 50 required</p>
            </div>
            <button
              className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting || applied || resumeText.trim().length < 50}
              onClick={async () => {
                setError("");
                setMessage("");
                setSubmitting(true);
                setApplied(true);
                try {
                  const combined = coverLetter.trim()
                    ? "Cover Letter:\n" + coverLetter.trim() + "\n\nResume:\n" + resumeText.trim()
                    : resumeText.trim();
                  await applyToJob(job.id, combined);
                  setMessage("Application submitted successfully. Good luck!");
                  setResumeText("");
                  setCoverLetter("");
                } catch {
                  setApplied(false);
                  setError("Unable to submit. Please make sure you are logged in and have not already applied.");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {applied ? "Applied" : submitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
