import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, login as loginRequest, register as registerRequest, type AuthUser } from "../api/auth";
import { resetBillingPlan } from "../services/billingService";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refreshUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setUser(await getMe());
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshUser();
  }, []);

  useEffect(() => {
    const handler = () => {
      localStorage.removeItem("token");
      resetBillingPlan();
      setUser(null);
      setLoading(false);
      navigate("/login", { replace: true });
    };

    window.addEventListener("app:auth:unauthorized", handler);
    return () => window.removeEventListener("app:auth:unauthorized", handler);
  }, [navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        const token = await loginRequest(email, password);
        localStorage.setItem("token", token.access_token);
        await refreshUser();
      },
      register: async (email, password) => {
        await registerRequest(email, password);
      },
      logout: () => {
        localStorage.removeItem("token");
        resetBillingPlan();
        setUser(null);
      },
      refreshUser,
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
