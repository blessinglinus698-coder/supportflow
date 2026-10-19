import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import type { Ticket } from "../../types/ticket";
import { StatusBadge, PriorityBadge } from "./Badges";
import { useTickets } from "../../context/TicketsContext";

interface TicketDetailProps {
  ticket: Ticket | null;
  onClose: () => void;
}

function TicketDetail({ ticket, onClose }: TicketDetailProps) {
  const { updateTicketNotes, suggestReply } = useTickets();
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiReply, setAiReply] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    setNotes(ticket?.notes || "");
    setAiReply("");
    setAiError("");
  }, [ticket]);

  if (!ticket) return null;

  async function handleSaveNotes() {
    setSaving(true);
    await updateTicketNotes(ticket!.id, notes);
    setSaving(false);
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

        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14 }}>
          <div>
            <p style={{ color: "var(--color-text-muted)", marginBottom: 2, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Customer</p>
            <p style={{ color: "var(--color-text)" }}>{ticket.customer}</p>
          </div>
          <div>
            <p style={{ color: "var(--color-text-muted)", marginBottom: 2, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Assigned To</p>
            <p style={{ color: "var(--color-text)" }}>{ticket.assignedTo}</p>
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