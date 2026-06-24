import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMyApplications, type Application } from "../api/applications";
import { ApplicationsSkeleton } from "../components/Skeletons";

const badgeColor = {
  applied: "bg-slate-100 text-slate-700",
  reviewing: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
  accepted: "bg-emerald-100 text-emerald-700",
} as const;

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMyApplications()
      .then(setApplications)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold">My Applications</h1>
        <p className="mt-2 text-slate-600">Track where you’ve applied and keep an eye on status updates.</p>
        <div className="mt-6 card overflow-hidden">
          {loading ? (
            <ApplicationsSkeleton />
          ) : applications.length === 0 ? (
            <div className="p-10 text-center text-slate-600">
              No applications yet. Start by applying to a role you like.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-left text-sm text-slate-600">
                  <tr>
                    <th className="px-6 py-4">Application</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {applications.map((application) => (
                    <tr key={application.id} className="text-sm">
                      <td className="px-6 py-4 font-medium text-slate-900">Job #{application.job_id}</td>
                      <td className="px-6 py-4">
                        <span className={`badge ${badgeColor[application.status]}`}>{application.status}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{new Date(application.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <Link className="text-brand-600 hover:underline" to={`/applications/${application.id}`}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
