import { useEffect, useState } from "react";
import { getWatchlist, addToWatchlist, removeFromWatchlist, type WatchlistEntry } from "../api/watchlist";

export default function WatchlistPage() {
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refresh = () =>
    getWatchlist()
      .then(setEntries)
      .catch(() => setError("Unable to load watchlist."))
      .finally(() => setLoading(false));

  useEffect(() => { refresh(); }, []);

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Company Watchlist</h1>
          <p className="mt-1 text-slate-500">Track companies and get notified when they post new internships overnight.</p>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Add a company</h2>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="flex gap-3">
            <input
              className="input flex-1"
              placeholder="e.g. Google, Stripe, Citadel"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && company.trim()) {
                  setSaving(true);
                  await addToWatchlist(company.trim());
                  setCompany("");
                  setSaving(false);
                  refresh();
                }
              }}
            />
            <button
              className="button-primary disabled:opacity-60"
              disabled={saving || company.trim().length < 2}
              onClick={async () => {
                setSaving(true);
                await addToWatchlist(company.trim());
                setCompany("");
                setSaving(false);
                refresh();
              }}
            >
              {saving ? "Adding..." : "Add"}
            </button>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold">Watching {entries.length} {entries.length === 1 ? "company" : "companies"}</h2>
          </div>
          {loading ? (
            <div className="p-6 text-slate-500">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="p-10 text-center text-slate-500">No companies added yet.</div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {entries.map((e) => (
                <li key={e.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <div className="font-medium text-slate-900">{e.company}</div>
                    <div className="text-xs text-slate-400">Added {new Date(e.created_at).toLocaleDateString()}</div>
                  </div>
                  <button
                    className="button-secondary text-sm text-red-600 border-red-200 hover:bg-red-50"
                    onClick={async () => { await removeFromWatchlist(e.id); refresh(); }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

