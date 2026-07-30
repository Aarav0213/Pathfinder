import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMyApplications, type Application } from "../api/applications";
import { getApplicationAnalytics, type ApplicationAnalytics } from "../api/analytics";
import { ApplicationsSkeleton } from "../components/Skeletons";

const badgeColor: Record<string, string> = {
  applied: "bg-slate-100 text-slate-700",
  reviewing: "bg-amber-100 text-amber-700",
  interview: "bg-blue-100 text-blue-700",
  offer: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  accepted: "bg-emerald-100 text-emerald-700",
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [analytics, setAnalytics] = useState<ApplicationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listMyApplications(), getApplicationAnalytics()])
      .then(([apps, stats]) => { setApplications(apps); setAnalytics(stats); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Applications</h1>
          <p className="mt-2 text-slate-600">Track where you have applied and monitor your progress.</p>
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
            <div className="p-10 text-center text-slate-600">No applications yet. Start by applying to a role you like.</div>
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
    </div>
  );
}
