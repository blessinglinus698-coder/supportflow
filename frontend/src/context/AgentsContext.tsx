import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Agent } from "../types/agent";
import { useAuth } from "./AuthContext";

const API_URL = "http://localhost:5000/api/agents";

interface AgentsContextValue {
  agents: Agent[];
  loading: boolean;
  addAgent: (agent: {
    name: string;
    email: string;
    role: Agent["role"];
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
  removeAgent: (id: string) => Promise<void>;
  updateAgentRole: (id: string, role: Agent["role"]) => Promise<void>;
}

const AgentsContext = createContext<AgentsContextValue | undefined>(undefined);

export function AgentsProvider({ children }: { children: ReactNode }) {
  const { token, logout } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const authHeaders = useCallback(
    (extra: Record<string, string> = {}) => ({ ...extra, Authorization: `Bearer ${token}` }),
    [token]
  );

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on logout
      setAgents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(API_URL, { headers: authHeaders() })
      .then((res) => {
        if (res.status === 401) {
          logout();
          return [];
        }
        return res.json();
      })
      .then((data) => setAgents(data))
      .catch((err) => console.error("Failed to load agents:", err))
      .finally(() => setLoading(false));
  }, [token, authHeaders, logout]);

  async function addAgent(agent: {
    name: string;
    email: string;
    role: Agent["role"];
    password: string;
    confirmPassword: string;
  }) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(agent),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to add agent");
    }
    setAgents((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
  }

  async function removeAgent(id: string) {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE", headers: authHeaders() });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to remove agent");
    }
    setAgents((prev) => prev.filter((a) => a.id !== id));
  }

  async function updateAgentRole(id: string, role: Agent["role"]) {
    const res = await fetch(`${API_URL}/${id}/role`, {
      method: "PATCH",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to update role");
    }
    setAgents((prev) => prev.map((a) => (a.id === id ? data : a)));
  }

  return (
    <AgentsContext.Provider value={{ agents, loading, addAgent, removeAgent, updateAgentRole }}>
      {children}
    </AgentsContext.Provider>
  );
}

export function useAgents() {
  const context = useContext(AgentsContext);
  if (!context) {
    throw new Error("useAgents must be used within an AgentsProvider");
  }
  return context;
}