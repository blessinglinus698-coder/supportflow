import { useState } from "react";
import { Trash2, UserPlus, ShieldCheck, ShieldOff } from "lucide-react";
import { useAgents } from "../context/AgentsContext";
import { useAuth } from "../context/AuthContext";
import type { AgentRole } from "../types/agent";

function Onboarding() {
  const { agents, loading, addAgent, removeAgent, updateAgentRole } = useAgents();
  const { agent: currentAgent } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AgentRole>("agent");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [rowError, setRowError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      await addAgent({ name, email, role, password, confirmPassword });
      setName("");
      setEmail("");
      setPassword("");
      setRole("agent");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleRole(id: string, currentRole: AgentRole) {
    setRowError("");
    try {
      await updateAgentRole(id, currentRole === "admin" ? "agent" : "admin");
    } catch (err) {
      setRowError(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  async function handleRemove(id: string) {
    setRowError("");
    try {
      await removeAgent(id);
    } catch (err) {
      setRowError(err instanceof Error ? err.message : "Failed to remove agent");
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid var(--color-border)",
    fontSize: 14,
    fontFamily: "inherit",
  };

  return (
    <div style={{ padding: 28, background: "var(--color-bg)", minHeight: "100%" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)", marginBottom: 22 }}>
        Onboarding
      </h1>

      <div
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 14,
          padding: 24,
          boxShadow: "var(--shadow-card)",
          maxWidth: 760,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", marginBottom: 4 }}>
          Agents
        </h2>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 18 }}>
          Manage who can be assigned tickets in SupportFlow.
        </p>

        <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>New agent's name</label>
              <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>New agent's email</label>
              <input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>New agent's password</label>
              <input
                type="password"
                style={inputStyle}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>Role</label>
              <select style={inputStyle} value={role} onChange={(e) => setRole(e.target.value as AgentRole)}>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-end",
              flexWrap: "wrap",
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              padding: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 4 }}>
              <ShieldCheck size={16} color="var(--color-primary)" />
              <span style={{ fontSize: 12, color: "var(--color-text-muted)", maxWidth: 180 }}>
                Confirm it's you — enter your own password
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>Your password</label>
              <input
                type="password"
                style={inputStyle}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Your admin password"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "var(--gradient-brand)",
                color: "#fff",
                border: "none",
                padding: "10px 16px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: submitting ? "default" : "pointer",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              <UserPlus size={16} />
              {submitting ? "Adding..." : "Add Agent"}
            </button>
          </div>
        </form>

        {error && (
          <p style={{ color: "#b91c1c", fontSize: 13, background: "#fef2f2", padding: 10, borderRadius: 8, marginBottom: 16 }}>
            {error}
          </p>
        )}
        {rowError && (
          <p style={{ color: "#b91c1c", fontSize: 13, background: "#fef2f2", padding: 10, borderRadius: 8, marginBottom: 16 }}>
            {rowError}
          </p>
        )}

        {loading ? (
          <p style={{ color: "var(--color-text-muted)" }}>Loading agents...</p>
        ) : (
          <div style={{ border: "1px solid var(--color-border)", borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                  <th style={{ padding: "10px 14px", fontSize: 12, color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Name</th>
                  <th style={{ padding: "10px 14px", fontSize: 12, color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Email</th>
                  <th style={{ padding: "10px 14px", fontSize: 12, color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Role</th>
                  <th style={{ padding: "10px 14px" }}></th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => {
                  const isSelf = a.id === currentAgent?.id;
                  return (
                    <tr key={a.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--color-text)" }}>
                        {a.name} {isSelf && <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(you)</span>}
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--color-text-muted)" }}>{a.email}</td>
                      <td style={{ padding: "10px 14px", textTransform: "capitalize" }}>{a.role}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center" }}>
                          <button
                            onClick={() => handleToggleRole(a.id, a.role)}
                            disabled={isSelf}
                            title={isSelf ? "You can't change your own role" : a.role === "admin" ? "Demote to agent" : "Promote to admin"}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              background: "none",
                              border: "1px solid var(--color-border)",
                              borderRadius: 6,
                              padding: "5px 9px",
                              fontSize: 12,
                              color: isSelf ? "var(--color-text-muted)" : "var(--color-text)",
                              cursor: isSelf ? "not-allowed" : "pointer",
                              opacity: isSelf ? 0.5 : 1,
                            }}
                          >
                            {a.role === "admin" ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                            {a.role === "admin" ? "Demote" : "Promote"}
                          </button>
                          <button
                            onClick={() => handleRemove(a.id)}
                            disabled={isSelf}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: isSelf ? "not-allowed" : "pointer",
                              color: isSelf ? "var(--color-text-muted)" : "#b91c1c",
                              opacity: isSelf ? 0.5 : 1,
                            }}
                            title={isSelf ? "You can't remove your own account" : "Remove agent"}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {agents.length === 0 && (
              <p style={{ padding: 24, textAlign: "center", color: "var(--color-text-muted)" }}>No agents yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Onboarding;