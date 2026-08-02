import ContactFooter from "../components/ContactFooter";
import { Link } from "react-router-dom";

const previewJobs = [
  {
    company: "IBM",
    initial: "I",
    title: "2026 Intern Conversion : Research Scientist",
    location: "Yorktown Heights",
    color: "bg-brand-500",
  },
  {
    company: "Meta",
    initial: "M",
    title: "Research Scientist Intern, Generative AI Trust and Safety",
    location: "New York",
    color: "bg-orange-500",
  },
  {
    company: "CACI",
    initial: "C",
    title: "Senior AI/ML Research Scientist in Data & Signal Processing",
    location: "Sterling",
    color: "bg-cyan-500",
  },
];

export default function HomePage() {
  return (
    <main className="bg-slate-50 min-h-[calc(100vh-65px)]">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="mb-5 inline-flex items-center rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm">
              Built for students searching smarter
            </div>

            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Find your next internship faster.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Pathfinder brings real internship listings, smart filters, saved jobs,
              company watchlists, and application tracking into one clean dashboard.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/jobs"
                className="inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
              >
                Start searching
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                Create free account
              </Link>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-2xl font-bold text-slate-950">Real</div>
                <div className="text-slate-500">job listings</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-950">Track</div>
                <div className="text-slate-500">applications</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-950">Watch</div>
                <div className="text-slate-500">companies</div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/70">
            <div className="rounded-[1.5rem] bg-slate-950 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">
                    Live preview
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">Recommended internships</h2>
                </div>
                <img src="/logo.png" alt="Pathfinder" className="h-11 w-11 rounded-xl object-cover" />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-[0.35fr_0.65fr]">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Filters</p>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl bg-white/10 px-3 py-2 text-sm text-slate-200">AI / ML</div>
                    <div className="rounded-xl bg-white/10 px-3 py-2 text-sm text-slate-200">New York</div>
                    <div className="rounded-xl bg-white/10 px-3 py-2 text-sm text-slate-200">Remote OK</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {previewJobs.map((job) => (
                    <div key={job.title} className="rounded-2xl bg-white p-4 text-slate-900 shadow-sm">
                      <div className="flex gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${job.color} text-sm font-bold text-white`}>
                          {job.initial}
                        </div>
                        <div className="min-w-0">
                          <h3 className="line-clamp-1 text-sm font-bold">{job.title}</h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {job.company} · {job.location}
                          </p>
                          <div className="mt-3 flex items-center gap-2">
                            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">
                              Live
                            </span>
                            <span className="text-xs font-semibold text-brand-600">View details →</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <ContactFooter />
    </main>
  );
}


