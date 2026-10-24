import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import type { TicketStatus, TicketPriority } from "../../types/ticket";
import { useTickets } from "../../context/TicketsContext";
import { useAgents } from "../../context/AgentsContext";

interface TicketDetailProps {
  ticketId: string | null;
  onClose: () => void;
}

function TicketDetail({ ticketId, onClose }: TicketDetailProps) {
  const { tickets, updateTicketNotes, updateTicketStatus, updateTicketPriority, updateTicketAssignedTo, suggestReply } =
    useTickets();
  const { agents } = useAgents();
  const ticket = tickets.find((t) => t.id === ticketId) || null;

  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [prioritySaving, setPrioritySaving] = useState(false);
  const [assignSaving, setAssignSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    setNotes(ticket?.notes || "");
    setAiReply("");
    setAiError("");
    setActionError("");
  }, [ticket]);

  if (!ticket) return null;

  async function handleSaveNotes() {
    setSaving(true);
    setActionError("");
    try {
      await updateTicketNotes(ticket!.id, notes);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to save notes");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as TicketStatus;
    setStatusSaving(true);
    setActionError("");
    try {
      await updateTicketStatus(ticket!.id, newStatus);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setStatusSaving(false);
    }
  }

  async function handlePriorityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newPriority = e.target.value as TicketPriority;
    setPrioritySaving(true);
    setActionError("");
    try {
      await updateTicketPriority(ticket!.id, newPriority);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update priority");
    } finally {
      setPrioritySaving(false);
    }
  }

  async function handleAssignedToChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newAssignedTo = e.target.value;
    setAssignSaving(true);
    setActionError("");
    try {
      await updateTicketAssignedTo(ticket!.id, newAssignedTo);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update assignment");
    } finally {
      setAssignSaving(false);
    }
  }

  async function handleSuggestReply() {
    setGenerating(true);
    setAiError("");
    setAiReply("");
    try {
      const reply = await suggestReply(ticket!.id);
      setAiReply(reply);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  const selectStyle: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid var(--color-border)",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "inherit",
    background: "var(--color-bg)",
    color: "var(--color-text)",
    cursor: "pointer",
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 40 }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: 400,
          background: "var(--color-card)",
          borderLeft: "1px solid var(--color-border)",
          boxShadow: "-8px 0 30px rgba(0,0,0,0.25)",
          zIndex: 50,
          padding: 26,
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ color: "var(--color-text-muted)", fontSize: 13, fontWeight: 600 }}>{ticket.id}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        <h2 style={{ fontSize: 19, fontWeight: 800, color: "var(--color-text)", marginBottom: 16 }}>{ticket.subject}</h2>

        {actionError && (
          <p
            style={{
              color: "#f87171",
              fontSize: 12,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              padding: 10,
              borderRadius: 8,
              marginBottom: 14,
            }}
          >
            {actionError}
          </p>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={ticket.priority}
            onChange={handlePriorityChange}
            disabled={prioritySaving}
            style={{ ...selectStyle, opacity: prioritySaving ? 0.6 : 1 }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <select
            value={ticket.status}
            onChange={handleStatusChange}
            disabled={statusSaving}
            style={{ ...selectStyle, opacity: statusSaving ? 0.6 : 1 }}
          >
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          {(statusSaving || prioritySaving) && (
            <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Saving...</span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14 }}>
          <div>
            <p style={{ color: "var(--color-text-muted)", marginBottom: 2, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Customer</p>
            <p style={{ color: "var(--color-text)" }}>{ticket.customer}</p>
          </div>
          <div>
            <p style={{ color: "var(--color-text-muted)", marginBottom: 4, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Assigned To</p>
            <select
              value={ticket.assignedTo}
              onChange={handleAssignedToChange}
              disabled={assignSaving}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                fontSize: 13,
                fontFamily: "inherit",
                background: "var(--color-bg)",
                color: "var(--color-text)",
                cursor: assignSaving ? "default" : "pointer",
                opacity: assignSaving ? 0.6 : 1,
              }}
            >
              <option value="Unassigned">Unassigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
            {assignSaving && (
              <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Saving...</span>
            )}
          </div>
          <div>
            <p style={{ color: "var(--color-text-muted)", marginBottom: 2, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Last Updated</p>
            <p style={{ color: "var(--color-text)" }}>{ticket.updatedAt}</p>
          </div>
        </div>

        <div style={{ marginTop: 28, borderTop: "1px solid var(--color-border)", paddingTop: 18 }}>
          <p style={{ color: "var(--color-text)", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
            Notes
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add context about this ticket — what the customer said, troubleshooting steps tried, etc."
            style={{
              width: "100%",
              minHeight: 110,
              padding: 10,
              borderRadius: 10,
              border: "1px solid var(--color-border)",
              fontSize: 13,
              fontFamily: "inherit",
              resize: "vertical",
              background: "var(--color-bg)",
              color: "var(--color-text)",
            }}
          />
          <button
            onClick={handleSaveNotes}
            disabled={saving}
            style={{
              marginTop: 8,
              background: "var(--gradient-brand)",
              color: "#fff",
              border: "none",
              padding: "9px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: saving ? "default" : "pointer",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Saving..." : "Save Notes"}
          </button>
        </div>

        <div style={{ marginTop: 24, borderTop: "1px solid var(--color-border)", paddingTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ color: "var(--color-text)", fontSize: 13, fontWeight: 700 }}>
              AI Suggested Reply
            </p>
            <button
              onClick={handleSuggestReply}
              disabled={generating}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "var(--color-bg)",
                color: "var(--color-primary)",
                border: "1px solid var(--color-border)",
                padding: "7px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: generating ? "default" : "pointer",
                opacity: generating ? 0.6 : 1,
              }}
            >
              <Sparkles size={14} />
              {generating ? "Generating..." : "Suggest Reply"}
            </button>
          </div>

          {aiError && (
            <p
              style={{
                color: "#f87171",
                fontSize: 12,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                padding: 10,
                borderRadius: 8,
              }}
            >
              {aiError}
            </p>
          )}

          {aiReply && (
            <div
              style={{
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: 10,
                padding: 12,
                fontSize: 13,
                whiteSpace: "pre-wrap",
                lineHeight: 1.5,
                color: "var(--color-text)",
              }}
            >
              {aiReply}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default TicketDetail;