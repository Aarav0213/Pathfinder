import { useEffect, useState, useTransition } from "react";
import { Link } from "react-router-dom";
import { listJobs, type Job } from "../api/jobs";
import { JobListSkeleton } from "../components/Skeletons";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

const PAGE_SIZE = 6;

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [keyword, setKeyword] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  const debouncedKeyword = useDebouncedValue(keyword, 350);
  const debouncedCompany = useDebouncedValue(company, 350);
  const debouncedLocation = useDebouncedValue(location, 350);

  useEffect(() => {
  const controller = new AbortController();

  setLoading(true);

  listJobs(
    {
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      keyword: debouncedKeyword || undefined,
      company: debouncedCompany || undefined,
      location: debouncedLocation || undefined,
    },
    { signal: controller.signal }
  )
    .then((data) => {
      setJobs(data);
      setError("");
    })
    .catch((err) => {
      if (err.name !== "CanceledError") {
        setError("Unable to load jobs right now.");
      }
    })
    .finally(() => setLoading(false));

  return () => controller.abort();
}, [debouncedKeyword, debouncedCompany, debouncedLocation, page]);

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-soft">
          <h1 className="text-3xl font-bold">Find your next opportunity</h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            Search jobs, filter by company or location, and apply in a few clicks.
          </p>
        </div>
        <div className="card p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="input"
              placeholder="Search jobs"
              value={keyword}
              onChange={(e) => startTransition(() => setKeyword(e.target.value))}
            />
            <input
              className="input"
              placeholder="Filter by company"
              value={company}
              onChange={(e) => startTransition(() => setCompany(e.target.value))}
            />
            <input
              className="input"
              placeholder="Filter by location"
              value={location}
              onChange={(e) => startTransition(() => setLocation(e.target.value))}
            />
          </div>
        </div>
        {error ? <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        <div className="mt-6 grid gap-4">
          {loading ? (
            <JobListSkeleton />
          ) : jobs.length === 0 ? (
            <div className="card p-10 text-center text-slate-600">No jobs found. Try adjusting your search.</div>
          ) : (
            jobs.map((job) => (
              <article key={job.id} className="card p-6 transition hover:-translate-y-0.5">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <div className="text-xl font-semibold text-slate-900">{job.title}</div>
                    <div className="mt-1 text-slate-600">
                      {job.company} · {job.location}
                    </div>
                    <p className="mt-4 line-clamp-3 text-sm text-slate-600">{job.description}</p>
                  </div>
                  <Link className="button-secondary whitespace-nowrap" to={`/jobs/${job.id}`}>
                    View details
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button className="button-secondary disabled:cursor-not-allowed disabled:opacity-60" disabled={page === 0 || loading} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            Previous
          </button>
          <span className="text-sm text-slate-600">Page {page + 1}</span>
          <button className="button-secondary disabled:cursor-not-allowed disabled:opacity-60" disabled={jobs.length < PAGE_SIZE || loading} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
