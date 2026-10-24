import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface AuthAgent {
  id: string;
  name: string;
  email: string;
  role: "admin" | "agent";
}

interface AuthContextValue {
  token: string | null;
  agent: AuthAgent | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const API_URL = "http://localhost:5000/api/auth";

// sessionStorage (not localStorage) is deliberate here: localStorage is shared
// across every tab on this site, so logging in as a different account in one
// tab would silently log out every other tab on refresh. sessionStorage is
// scoped per tab, so each tab keeps its own independent session.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem("supportflow-token")
  );
  const [agent, setAgent] = useState<AuthAgent | null>(() => {
    const saved = sessionStorage.getItem("supportflow-agent");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      sessionStorage.setItem("supportflow-token", token);
    } else {
      sessionStorage.removeItem("supportflow-token");
    }
  }, [token]);

  useEffect(() => {
    if (agent) {
      sessionStorage.setItem("supportflow-agent", JSON.stringify(agent));
    } else {
      sessionStorage.removeItem("supportflow-agent");
    }
  }, [agent]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }
      setToken(data.token);
      setAgent(data.agent);
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Sign up failed");
      }
      setToken(data.token);
      setAgent(data.agent);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setAgent(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, agent, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}