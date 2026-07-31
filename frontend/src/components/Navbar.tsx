import { NavLink, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useRef, useState } from "react";
import { getNotifications, markAllRead, type Notification } from "../api/notifications";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  ["px-4 py-2 text-sm font-medium transition rounded-full",
    isActive ? "bg-brand-600 text-white" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"].join(" ");

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    getNotifications().then(setNotifications).catch(() => {});
    const interval = setInterval(() => {
      getNotifications().then(setNotifications).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unread = notifications.filter((n) => n.read === 0).length;
  const isPremium = Boolean((user as any)?.is_premium);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">

        <Link to="/jobs" className="flex items-center gap-2.5 shrink-0">
          <div className="h-8 w-8 rounded-lg overflow-hidden shrink-0"><img src="/logo.png" alt="Pathfinder" className="h-full w-full object-cover" /></div>
          <span className="font-semibold text-slate-900 hidden sm:block">Pathfinder</span>
        </Link>

        <nav className="flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2">
          <NavLink to="/jobs" className={linkClass}>Jobs</NavLink>
          {user && <NavLink to="/applications" className={linkClass}>Applications</NavLink>}
          {(user?.role === "recruiter" || user?.role === "admin") && (
            <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
          )}
          {!isPremium && <NavLink to="/upgrade" className={linkClass}>Upgrade</NavLink>}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {!user ? (
            <>
              <NavLink to="/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition rounded-full hover:bg-slate-100">
                Login
              </NavLink>
              <NavLink to="/register" className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-full hover:bg-brand-700 transition">
                Sign up
              </NavLink>
            </>
          ) : (
            <>
              {isPremium && (
                <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-xs font-semibold text-brand-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 inline-block"></span>
                  Pro
                </span>
              )}

              <div className="relative" ref={notifRef}>
                <button
                  className="relative p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                  onClick={() => {
                    setShowNotifs(!showNotifs);
                    setShowUserMenu(false);
                    if (!showNotifs && unread > 0) {
                      markAllRead().then(() => setNotifications((n) => n.map((x) => ({ ...x, read: 1 }))));
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.437L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unread > 0 && (
                    <span className="absolute top-0.5 right-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>
                {showNotifs && (
                  <div className="absolute right-0 top-11 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm text-slate-700">Notifications</div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-slate-400">No notifications yet.</div>
                      ) : notifications.map((n) => (
                        <div key={n.id} className={"px-4 py-3 " + (n.read === 0 ? "bg-brand-50" : "")}>
                          <div className="text-sm font-medium text-slate-800">{n.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{n.message}</div>
                          <div className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={userMenuRef}>
                <button
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100 transition"
                  onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false); }}
                >
                  <div className="h-7 w-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                    {user.email[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-20 truncate">
                    {user.email.split("@")[0]}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-10 w-52 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                      <div className="text-sm font-medium text-slate-900 truncate">{user.email}</div>
                      <div className="text-xs text-slate-400 capitalize mt-0.5 flex items-center gap-1">
                        {user.role}
                        {isPremium && <span className="text-brand-600 font-semibold">&middot; Pro</span>}
                      </div>
                    </div>
                    <div className="py-1">
                      {[
                        { to: "/profile", label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
                        { to: "/saved", label: "Saved Jobs", icon: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4.5L5 21V5z" },
                        { to: "/watchlist", label: "Watchlist", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" },
                        ...(user?.role === "admin" ? [{ to: "/admin", label: "Admin Panel", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }] : []),
                        ...(!isPremium ? [{ to: "/upgrade", label: "Upgrade to Pro", icon: "M13 10V3L4 14h7v7l9-11h-7z" }] : []),
                      ].map(({ to, label, icon }) => (
                        <Link key={to} to={to} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition" onClick={() => setShowUserMenu(false)}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                          </svg>
                          {label}
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 py-1">
                      <button
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                        onClick={() => { logout(); navigate("/login"); setShowUserMenu(false); }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}




