import { useEffect, useRef, useState } from "react";
import { getProfile, updateProfile, type UserProfile } from "../api/profile";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({
    resume_text: "", skills: "", target_roles: "", preferred_locations: "", graduation_year: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getProfile()
      .then((p) => {
        setProfile(p);
        setForm({
          resume_text: p.resume_text || "",
          skills: p.skills || "",
          target_roles: p.target_roles || "",
          preferred_locations: p.preferred_locations || "",
          graduation_year: p.graduation_year ? String(p.graduation_year) : "",
        });
      })
      .catch(() => setError("Unable to load profile."))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await updateProfile({
        resume_text: form.resume_text || undefined,
        skills: form.skills || undefined,
        target_roles: form.target_roles || undefined,
        preferred_locations: form.preferred_locations || undefined,
        graduation_year: form.graduation_year ? Number(form.graduation_year) : undefined,
      });
      setMessage("Profile saved.");
    } catch {
      setError("Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post<UserProfile>("/users/me/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((f) => ({ ...f, resume_text: res.data.resume_text || "" }));
      setMessage("Resume uploaded and extracted successfully.");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Unable to upload resume.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (loading) return <div className="page-shell p-10 text-slate-500">Loading...</div>;

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="mt-1 text-slate-500">
            {user?.email} &nbsp;&mdash;&nbsp;
            <span className="capitalize">{user?.role}</span>
            {profile?.is_premium ? <span className="ml-2 inline-block w-2 h-2 rounded-full bg-brand-500" title="Pro"></span> : null}
          </p>
        </div>

        <div className="card p-6 space-y-4">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Resume</label>
            <div className="flex gap-3 mb-2">
              <button
                className="button-secondary text-sm disabled:opacity-60"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? "Uploading..." : "Upload PDF / DOCX / TXT"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
              <span className="text-xs text-slate-400 self-center">or paste below</span>
            </div>
            <textarea
              className="input min-h-48"
              placeholder="Paste your resume text here, or upload a file above."
              value={form.resume_text}
              onChange={(e) => setForm({ ...form, resume_text: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Skills</label>
            <input className="input" placeholder="e.g. Python, React, Machine Learning, SQL" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Roles</label>
            <input className="input" placeholder="e.g. Software Engineer, Data Scientist" value={form.target_roles} onChange={(e) => setForm({ ...form, target_roles: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Locations</label>
            <input className="input" placeholder="e.g. Remote, New York, San Francisco" value={form.preferred_locations} onChange={(e) => setForm({ ...form, preferred_locations: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Graduation Year</label>
            <input className="input" type="number" placeholder="e.g. 2026" value={form.graduation_year} onChange={(e) => setForm({ ...form, graduation_year: e.target.value })} />
          </div>

          <button className="button-primary w-full disabled:opacity-60" disabled={saving} onClick={save}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>

        {!profile?.is_premium && (
          <div className="card p-6 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-900">Upgrade to Pro</div>
              <div className="text-sm text-slate-500 mt-1">Unlock AI cover letters, resume tailoring, and company watchlists.</div>
            </div>
            <a href="/upgrade" className="button-primary whitespace-nowrap">Upgrade</a>
          </div>
        )}
      </div>
    </div>
  );
}
