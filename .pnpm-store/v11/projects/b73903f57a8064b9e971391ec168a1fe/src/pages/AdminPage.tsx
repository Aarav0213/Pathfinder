import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

type Stats = {
  total_users: number;
  total_jobs: number;
  total_applications: number;
  premium_users: number;
  jobs_by_source: Record<string, number>;
};

type User = {
  id: number;
  email: string;
  role: string;
  is_premium: number;
};

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user?.role !== "admin") { navigate("/"); return; }
    Promise.all([
      api.get<Stats>("/admin/stats"),
      api.get<User[]>("/admin/users"),
    ])
      .then(([statsRes, usersRes]) => {
        setStats(statsRes.data);
        setUsers(usersRes.data);
      })
      .catch(() => setError("Unable to load admin data."))
      .finally(() => setLoading(false));
  }, [user]);

  const updateUser = async (id: number, patch: Partial<User>) => {
    try {
      const res = await api.patch<User>("/admin/users/" + id, patch);
      setUsers((u) => u.map((x) => x.id === id ? res.data : x));
      setMessage("User updated.");
      setTimeout(() => setMessage(""), 2000);
    } catch {
      setError("Unable to update user.");
    }
  };

  if (loading) return <div className="page-shell p-10 text-slate-500">Loading...</div>;
  if (error) return <div className="page-shell p-10 text-red-600">{error}</div>;

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="mt-1 text-slate-500">Platform overview and user management.</p>
        </div>

        {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

        {stats && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Total Users", stats.total_users],
              ["Premium Users", stats.premium_users],
              ["Total Jobs", stats.total_jobs],
              ["Total Applications", stats.total_applications],
            ].map(([label, value]) => (
              <div key={label as string} className="card p-5 text-center">
                <div className="text-3xl font-bold text-slate-900">{value}</div>
                <div className="text-sm text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        )}

        {stats && (
          <div className="card p-6 overflow-hidden">
            <h2 className="text-lg font-semibold mb-4">Jobs by Source</h2>
            <div className="flex flex-wrap gap-3" style={{overflow:"hidden"}}>
              {Object.entries(stats.jobs_by_source).map(([source, count]) => (
                <div key={source} className="rounded-xl border border-slate-200 px-4 py-3 text-center min-w-24">
                  <div className="text-2xl font-bold text-slate-900">{count}</div>
                  <div className="text-xs text-slate-500 mt-0.5 capitalize">{source}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Users</h2>
            <span className="text-sm text-slate-500">{users.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Premium</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((u) => (
                  <tr key={u.id} className="text-sm">
                    <td className="px-6 py-4 text-slate-400">{u.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{u.email}</td>
                    <td className="px-6 py-4">
                      <select
                        className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                        value={u.role}
                        onChange={(e) => updateUser(u.id, { role: e.target.value })}
                      >
                        <option value="user">user</option>
                        <option value="recruiter">recruiter</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        className={"text-xs font-medium px-3 py-1 rounded-full border transition " + (u.is_premium ? "bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100" : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200")}
                        onClick={() => updateUser(u.id, { is_premium: u.is_premium ? 0 : 1 })}
                      >
                        {u.is_premium ? "Pro" : "Free"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">Click role or Pro to update</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


