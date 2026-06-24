import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getApplication, type Application } from "../api/applications";
import { ApplicationsSkeleton } from "../components/Skeletons";

export default function ApplicationDetailPage() {
  const { id } = useParams();
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
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <ApplicationsSkeleton />
        </div>
      </div>
    );
  }

  if (!application) {
    return <div className="page-shell p-10"><div className="card p-8 text-center text-slate-600">Application not found.</div></div>;
  }

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="card p-8">
          <h1 className="text-3xl font-bold">Application #{application.id}</h1>
          <div className="mt-4 grid gap-4 text-sm text-slate-700">
            <div><span className="font-semibold">Job ID:</span> {application.job_id}</div>
            <div><span className="font-semibold">Status:</span> {application.status}</div>
            <div><span className="font-semibold">Created:</span> {new Date(application.created_at).toLocaleString()}</div>
          </div>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
            {application.resume_text}
          </div>
        </div>
      </div>
    </div>
  );
}
