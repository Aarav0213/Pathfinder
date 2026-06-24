import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isProUser } from "../services/billingService";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-full px-4 py-2 text-sm font-medium transition",
    isActive ? "bg-brand-600 text-white" : "text-slate-700 hover:bg-slate-100",
  ].join(" ");

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pro = isProUser();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-lg font-bold text-white">
            J
          </div>
          <div>
            <div className="font-semibold text-slate-900">Job Board</div>
            <div className="text-xs text-slate-500">Find your next role</div>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <NavLink to="/jobs" className={linkClass}>
            Jobs
          </NavLink>
          <NavLink to="/applications" className={linkClass}>
            Applications
          </NavLink>
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/upgrade" className={linkClass}>
            Upgrade
          </NavLink>
          {!user ? (
            <>
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
              <NavLink to="/register" className={linkClass}>
                Register
              </NavLink>
            </>
          ) : (
            <button
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Logout
            </button>
          )}
          {user ? (
            <span className="badge bg-slate-100 text-slate-700">
              {user.role}
              {pro ? " · Pro" : ""}
            </span>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
