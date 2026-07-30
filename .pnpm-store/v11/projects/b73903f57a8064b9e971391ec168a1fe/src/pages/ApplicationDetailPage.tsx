import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getApplication, type Application } from "../api/applications";
import { ApplicationsSkeleton } from "../components/Skeletons";

const badgeColor: Record<string, string> = {
  applied: "bg-slate-100 text-slate-700",
  reviewing: "bg-amber-100 text-amber-700",
  interview: "bg-blue-100 text-blue-700",
  offer: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  accepted: "bg-emerald-100 text-emerald-700",
};

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getApplication(Number(id))
      .then(setApplication)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="page-shell">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8"><ApplicationsSkeleton /></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="page-shell p-10">
        <div className="card p-8 text-center text-slate-600">Application not found.</div>
      </div>
    );
  }

  const jobTitle = (application as any).job_title || "Job #" + application.job_id;
  const jobCompany = (application as any).job_company || "";

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <button className="text-sm text-slate-500 hover:text-slate-800" onClick={() => navigate(-1)}>
          &larr; Back to applications
        </button>
        <div className="card p-8 space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold">{jobTitle}</h1>
              {jobCompany && <p className="mt-1 text-slate-500">{jobCompany}</p>}
              <Link className="mt-2 inline-block text-sm text-brand-600 hover:underline" to={"/jobs/" + application.job_id}>
                View job listing
              </Link>
            </div>
            <span className={"badge text-sm px-4 py-2 " + (badgeColor[application.status] || "bg-slate-100 text-slate-700")}>
              {application.status}
            </span>
          </div>
          <div className="text-sm text-slate-500">Submitted {new Date(application.created_at).toLocaleString()}</div>
          <div>
            <div className="text-sm font-semibold text-slate-700 mb-2">Application Content</div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
              {application.resume_text}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
