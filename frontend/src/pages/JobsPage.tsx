import ContactFooter from "../components/ContactFooter";
import { useEffect, useState, useTransition } from "react";
import { Link } from "react-router-dom";
import { listJobs, type Job } from "../api/jobs";
import { getRecommendations } from "../api/recommendations";
import { JobListSkeleton } from "../components/Skeletons";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useAuth } from "../context/AuthContext";

const PAGE_SIZE = 10;

const companyColors: Record<string, string> = {
  a: "bg-violet-500", b: "bg-blue-500", c: "bg-cyan-500",
  d: "bg-emerald-500", e: "bg-teal-500", f: "bg-indigo-500",
  g: "bg-green-500", h: "bg-sky-500", i: "bg-purple-500",
  j: "bg-pink-500", k: "bg-rose-500", l: "bg-orange-500",
  m: "bg-amber-500", n: "bg-lime-500", o: "bg-red-500",
  p: "bg-fuchsia-500", q: "bg-violet-600", r: "bg-blue-600",
  s: "bg-cyan-600", t: "bg-emerald-600", u: "bg-teal-600",
  v: "bg-indigo-600", w: "bg-green-600", x: "bg-sky-600",
  y: "bg-purple-600", z: "bg-pink-600",
};

function CompanyAvatar({ name }: { name: string }) {
  const letter = name[0]?.toLowerCase() || "a";
  const color = companyColors[letter] || "bg-slate-400";
  return (
    <div className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white font-bold text-sm " + color}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
      <div className="flex gap-4 items-start">
        <CompanyAvatar name={job.company} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-base font-semibold text-slate-900 leading-snug">{job.title}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{job.company} &middot; {job.location}</p>
            </div>
            <Link className="shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition" to={"/jobs/" + job.id}>
              View details
            </Link>
          </div>
          <p className="mt-3 text-sm text-slate-500 line-clamp-2 leading-relaxed">{job.description}</p>
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <span className="text-xs text-slate-400">
              Posted {new Date(job.posted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            {(job as any).source === "greenhouse" && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Greenhouse</span>
            )}
            {(job as any).source === "jsearch" && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Live</span>
            )}
            {(job as any).apply_url && (
              <a href={(job as any).apply_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-600 hover:underline">
                Apply directly &rarr;
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recommendations, setRecommendations] = useState<Job[]>([]);
  const [keyword, setKeyword] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("newest");
  const [dateRange, setDateRange] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [employmentType, setEmploymentType] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sparse, setSparse] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [, startTransition] = useTransition();

  const debouncedKeyword = useDebouncedValue(keyword, 350);
  const debouncedCompany = useDebouncedValue(company, 350);
  const debouncedLocation = useDebouncedValue(location, 350);

  useEffect(() => {
    if (user) getRecommendations().then(setRecommendations).catch(() => {});
  }, [user]);

  useEffect(() => {
    setPage(0);
    setSparse(false);
  }, [debouncedKeyword, debouncedCompany, debouncedLocation, sort, dateRange, remoteOnly, employmentType]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const params: Record<string, any> = { limit: PAGE_SIZE, offset: page * PAGE_SIZE, sort };
    if (debouncedKeyword) params.keyword = debouncedKeyword;
    if (debouncedCompany) params.company = debouncedCompany;
    if (debouncedLocation) params.location = debouncedLocation;
    if (dateRange) params.date_range = dateRange;
    if (remoteOnly) params.remote_only = true;
    if (employmentType) params.employment_type = employmentType;
    listJobs(params)
      .then((data) => {
        setJobs(data);
        setError("");
        const hasSearch = debouncedKeyword || debouncedCompany || debouncedLocation;
        setSparse(!!hasSearch && data.length > 0 && data.length < PAGE_SIZE);
      })
      .catch((err) => { if (err.name !== "CanceledError") setError("Unable to load jobs right now."); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [debouncedKeyword, debouncedCompany, debouncedLocation, sort, dateRange, remoteOnly, page]);

  const hasActiveFilters = keyword || company || location || dateRange || remoteOnly || employmentType;

  const FilterPanel = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filters</div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-600">Role / Skill</label>
        <input className="input text-sm py-2" placeholder="e.g. react, ml, backend" value={keyword} onChange={(e) => startTransition(() => setKeyword(e.target.value))} />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-600">Company</label>
        <input className="input text-sm py-2" placeholder="e.g. Google, Stripe" value={company} onChange={(e) => startTransition(() => setCompany(e.target.value))} />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-600">Location</label>
        <input className="input text-sm py-2" placeholder="e.g. New York, Austin" value={location} onChange={(e) => startTransition(() => setLocation(e.target.value))} />
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <div
          className={"relative w-10 h-6 rounded-full transition-colors " + (remoteOnly ? "bg-brand-600" : "bg-slate-200")}
          onClick={() => setRemoteOnly(!remoteOnly)}
        >
          <div className={"absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform " + (remoteOnly ? "translate-x-4" : "")} />
        </div>
        <span className="text-sm font-medium text-slate-700">Remote only</span>
      </label>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-600">Employment type</label>
        <select className="input text-sm py-2" value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
          <option value="">All types</option>
          <option value="INTERN">Internship</option>
          <option value="FULLTIME">Full-time</option>
          <option value="PARTTIME">Part-time</option>
          <option value="CONTRACTOR">Contract</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-600">Sort by</label>
        <select className="input text-sm py-2" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-600">Date posted</label>
        <select className="input text-sm py-2" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
          <option value="">All time</option>
          <option value="today">Last 24 hours</option>
          <option value="week">Last 7 days</option>
          <option value="month">Last 30 days</option>
        </select>
      </div>
      {hasActiveFilters && (
        <button className="w-full text-xs font-medium text-slate-500 hover:text-slate-800 py-1 transition" onClick={() => { setKeyword(""); setCompany(""); setLocation(""); setDateRange(""); setSort("newest"); setRemoteOnly(false); setEmploymentType(""); }}>
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-7xl px-4 py-8 pb-12 sm:px-6 lg:px-8">

        <div className="mb-8 rounded-3xl bg-slate-900 px-8 py-12 text-white">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight leading-tight">Find your next internship</h1>
            <p className="mt-3 text-base text-slate-400 max-w-lg">Search thousands of real listings from top companies. Filter, sort, and apply in minutes.</p>
          </div>
        </div>

        {user && recommendations.length > 0 && !hasActiveFilters && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-800">Recommended for you</h2>
              <span className="text-xs text-slate-400">Based on your activity</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recommendations.slice(0, 3).map((job) => (
                <div key={job.id} className="rounded-2xl border border-brand-200 bg-brand-50 p-4 hover:shadow-md transition-all">
                  <div className="flex gap-3 items-start">
                    <CompanyAvatar name={job.company} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">{job.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{job.company} &middot; {job.location}</div>
                      <Link className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline" to={"/jobs/" + job.id}>View details &rarr;</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-6 items-start">
          <aside className="hidden lg:block w-56 shrink-0">
            <FilterPanel />
          </aside>

          <div className="flex-1 min-w-0 space-y-3">

            <div className="lg:hidden">
              <button
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                  </svg>
                  Filters {hasActiveFilters ? "(" + [keyword, company, location, remoteOnly ? "remote" : "", dateRange].filter(Boolean).length + " active)" : ""}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className={"h-4 w-4 text-slate-400 transition-transform " + (showFilters ? "rotate-180" : "")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showFilters && (
                <div className="mt-2">
                  <FilterPanel />
                </div>
              )}
            </div>

            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {sparse && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Limited results found. We have logged your search and will pull more listings overnight.
              </div>
            )}

            {loading ? <JobListSkeleton /> : jobs.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <div className="text-slate-700 font-medium">No results found</div>
                <div className="text-sm text-slate-400 mt-1">We have logged your search and will pull matching listings overnight.</div>
              </div>
            ) : (
              jobs.map((job) => <JobCard key={job.id} job={job} />)
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition" disabled={page === 0 || loading} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</button>
              <span className="text-sm text-slate-500 font-medium">Page {page + 1}</span>
              <button className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition" disabled={jobs.length < PAGE_SIZE || loading} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}









