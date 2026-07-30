import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "../components/Alert";
import Spinner from "../components/Spinner";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="page-shell flex items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-3xl font-bold">Create your account</h1>
        <p className="mt-2 text-slate-600">Join the job board and start applying.</p>
        <div className="mt-6 space-y-4">
          <Alert type="error" message={error} />
          <Alert type="success" message={success} />
          <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button
            className="button-primary w-full"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setError("");
              try {
                const res = await fetch("http://127.0.0.1:8000/auth/register", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email, password }),
                });
                if (!res.ok) throw new Error("Registration failed");
                setSuccess("Registration successful. Please log in.");
                setTimeout(() => navigate("/login"), 700);
              } catch {
                setError("Unable to register. The email may already be in use.");
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? <Spinner /> : "Register"}
          </button>
          <p className="text-sm text-slate-600">
            Already have an account? <Link className="text-brand-600 hover:underline" to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
