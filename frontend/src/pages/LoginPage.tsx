import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Alert from "../components/Alert";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname?: string } } | undefined)?.from
      ?.pathname || "/jobs";

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      await login(data.access_token);
      navigate(from, { replace: true });
    } catch (err) {
      setError("Unable to log in. Check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell flex items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="mt-2 text-slate-600">
          Log in to apply for jobs and manage your dashboard.
        </p>
        <div className="mt-6 space-y-4">
          <Alert type="error" message={error} />
          <input
            className="input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="button-primary w-full"
            disabled={loading}
            onClick={handleLogin}
          >
            {loading ? <Spinner /> : "Login"}
          </button>
          <p className="text-sm text-slate-600">
            New here?{" "}
            <Link className="text-brand-600 hover:underline" to="/register">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
