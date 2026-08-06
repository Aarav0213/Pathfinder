import ContactFooter from "../components/ContactFooter";
import { useEffect, useState } from "react";
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
          </div>
        </div>
      </div>
    </div>
  );
}

type FilterPanelProps = {
  keyword: string; setKeyword: (v: string) => void;
  company: string; setCompany: (v: string) => void;
  location: string; setLocation: (v: string) => void;
  remoteOnly: boolean; setRemoteOnly: (v: boolean) => void;
  employmentType: string; setEmploymentType: (v: string) => void;
  sort: string; setSort: (v: string) => void;
  dateRange: string; setDateRange: (v: string) => void;
  hasActiveFilters: boolean;
  onClear: () => void;
};

function FilterPanel({
  keyword, setKeyword, company, setCompany, location, setLocation,
  remoteOnly, setRemoteOnly, employmentType, setEmploymentType,
  sort, setSort, dateRange, setDateRange, hasActiveFilters, onClear
}: FilterPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filters</div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-600">Role / Skill</label>
        <input className="input text-sm py-2" placeholder="e.g. react, ml, backend" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-600">Company</label>
        <input className="input text-sm py-2" placeholder="e.g. Google, Stripe" value={company} onChange={(e) => setCompany(e.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-600">Location</label>
        <input className="input text-sm py-2" placeholder="e.g. New York, Austin" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <div className={"relative w-10 h-6 rounded-full transition-colors " + (remoteOnly ? "bg-brand-600" : "bg-slate-200")} onClick={() => setRemoteOnly(!remoteOnly)}>
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
        <button className="w-full text-xs font-medium text-slate-500 hover:text-slate-800 py-1 transition" onClick={onClear}>
          Clear all filters
        </button>
      )}
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
  const [showFilters, setShowFilters] = useState(false);

  const debouncedKeyword = useDebouncedValue(keyword, 350);
  const debouncedCompany = useDebouncedValue(company, 350);
  const debouncedLocation = useDebouncedValue(location, 350);

  const handleClear = () => {
    setKeyword(""); setCompany(""); setLocation(""); setDateRange("");
    setSort("newest"); setRemoteOnly(false); setEmploymentType("");
  };

  useEffect(() => {
    if (user) getRecommendations().then(setRecommendations).catch(() => {});
  }, [user]);

  useEffect(() => {
    setPage(0);
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
      })
      .catch((err) => { if (err.name !== "CanceledError") setError("Unable to load jobs right now."); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [debouncedKeyword, debouncedCompany, debouncedLocation, sort, dateRange, remoteOnly, employmentType, page]);

  const hasActiveFilters = !!(keyword || company || location || dateRange || remoteOnly || employmentType);

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-7xl px-4 py-8 pb-12 sm:px-6 lg:px-8">
        <div className="flex gap-6 items-start">
          <aside className="hidden lg:block w-56 shrink-0">
            <FilterPanel keyword={keyword} setKeyword={setKeyword} company={company} setCompany={setCompany} location={location} setLocation={setLocation} remoteOnly={remoteOnly} setRemoteOnly={setRemoteOnly} employmentType={employmentType} setEmploymentType={setEmploymentType} sort={sort} setSort={setSort} dateRange={dateRange} setDateRange={setDateRange} hasActiveFilters={hasActiveFilters} onClear={handleClear} />
          </aside>
          <div className="flex-1 min-w-0 space-y-3">
            {loading ? <JobListSkeleton /> : jobs.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <div className="text-slate-700 font-medium">No results found</div>
              </div>
            ) : (
              jobs.map((job) => <JobCard key={job.id} job={job} />)
            )}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm disabled:opacity-40" disabled={page === 0 || loading} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</button>
              <span className="text-sm text-slate-500 font-medium">Page {page + 1}</span>
              <button className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm disabled:opacity-40" disabled={jobs.length < PAGE_SIZE || loading} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
