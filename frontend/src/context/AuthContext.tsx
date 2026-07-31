import { createContext, useContext, useEffect, useState } from "react";

type User = {
  id: number;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>(null as any);

async function fetchUser(token: string): Promise<User> {
  const res = await fetch("https://pathfinder-cryd.onrender.com/auth/me", {
    headers: { Authorization: "Bearer " + token },
  });
  if (!res.ok) throw new Error("bad token");
  return res.json();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setLoading(false);
      return;
    }
    fetchUser(storedToken)
      .then((data) => {
        setToken(storedToken);
        setUser(data);
      })
      .catch(() => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    try {
      const data = await fetchUser(newToken);
      setUser(data);
    } catch {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

