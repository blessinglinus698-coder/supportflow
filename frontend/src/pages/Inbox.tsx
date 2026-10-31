import { useState, useEffect, useCallback } from "react";
import { Search, Send, Mail, Phone, Building2 } from "lucide-react";
import { useTickets } from "../context/TicketsContext";
import { useCustomers } from "../context/CustomersContext";
import { useAgents } from "../context/AgentsContext";
import { useAuth } from "../context/AuthContext";
import { StatusBadge, PriorityBadge } from "../components/tickets/Badges";
import type { TicketStatus, TicketPriority } from "../types/ticket";

const API_URL = "http://localhost:5000/api/tickets";

interface TicketMessage {
  id: string;
  ticketId: string;
  sender: "agent" | "customer";
  authorName: string | null;
  body: string;
  createdAt: string;
}

const filters: (TicketStatus | "all")[] = ["all", "open", "pending", "resolved", "closed"];

function Inbox() {
  const { tickets, updateTicketStatus, updateTicketPriority, updateTicketAssignedTo, updateTicketNotes } =
    useTickets();
  const { customers } = useCustomers();
  const { agents } = useAgents();
  const { token } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<TicketStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const [notesDraft, setNotesDraft] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesMsg, setNotesMsg] = useState("");
  const [actionError, setActionError] = useState("");

  const sortedTickets = [...tickets].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const filteredTickets = sortedTickets.filter((t) => {
    const matchesStatus = activeFilter === "all" || t.status === activeFilter;
    const matchesSearch =
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const selectedTicket = tickets.find((t) => t.id === selectedId) || null;
  const customerRecord = selectedTicket ? customers.find((c) => c.name === selectedTicket.customer) : null;

  // Default to the most recent conversation once the list has loaded, if
  // nothing is selected yet.
  useEffect(() => {
    if (!selectedId && filteredTickets.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time default selection once tickets load
      setSelectedId(filteredTickets[0].id);
    }
  }, [filteredTickets, selectedId]);

  const authHeaders = useCallback(
    (extra: Record<string, string> = {}) => ({ ...extra, Authorization: `Bearer ${token}` }),
    [token]
  );

  const loadMessages = useCallback(
    async (ticketId: string) => {
      setMessagesLoading(true);
      try {
        const res = await fetch(`${API_URL}/${ticketId}/messages`, { headers: authHeaders() });
        if (!res.ok) throw new Error("Failed to load messages");
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error(err);
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    },
    [authHeaders]
  );

  useEffect(() => {
    if (selectedTicket) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch triggered by selection change, not synchronous state churn
      loadMessages(selectedTicket.id);
      setNotesDraft(selectedTicket.notes);
      setReplyText("");
      setSendError("");
      setActionError("");
      setNotesMsg("");
    } else {
      setMessages([]);
    }
  }, [selectedTicket, loadMessages]);

  async function handleSendReply() {
    if (!selectedTicket || !replyText.trim()) return;
    setSending(true);
    setSendError("");
    try {
      const res = await fetch(`${API_URL}/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ body: replyText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reply");
      setMessages((prev) => [...prev, data]);
      setReplyText("");
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  async function handleSaveNotes() {
    if (!selectedTicket) return;
    setNotesSaving(true);
    setActionError("");
    setNotesMsg("");
    try {
      await updateTicketNotes(selectedTicket.id, notesDraft);
      setNotesMsg("Saved.");
      setTimeout(() => setNotesMsg(""), 2000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to save notes");
    } finally {
      setNotesSaving(false);
    }
  }

  async function handleStatusChange(status: TicketStatus) {
    if (!selectedTicket) return;
    try {
      await updateTicketStatus(selectedTicket.id, status);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  async function handlePriorityChange(priority: TicketPriority) {
    if (!selectedTicket) return;
    try {
      await updateTicketPriority(selectedTicket.id, priority);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update priority");
    }
  }

  async function handleAssignedToChange(assignedTo: string) {
    if (!selectedTicket) return;
    try {
      await updateTicketAssignedTo(selectedTicket.id, assignedTo);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update assignment");
    }
  }

  const selectStyle: React.CSSProperties = {
    padding: "7px 10px",
    borderRadius: 8,
    border: "1px solid var(--color-border)",
    fontSize: 13,
    fontFamily: "inherit",
    background: "var(--color-bg)",
    color: "var(--color-text)",
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", background: "var(--color-bg)" }}>
      {/* Conversation list */}
      <div
        style={{
          width: 340,
          flexShrink: 0,
          borderRight: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "var(--color-card)",
        }}
      >
        <div style={{ padding: "18px 16px 12px" }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text)", marginBottom: 12 }}>Inbox</h1>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <Search size={14} style={{ position: "absolute", top: 10, left: 10, color: "var(--color-text-muted)" }} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              style={{
                width: "100%",
                padding: "8px 10px 8px 30px",
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                fontSize: 13,
                background: "var(--color-bg)",
                color: "var(--color-text)",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  padding: "5px 11px",
                  borderRadius: 999,
                  border: activeFilter === f ? "none" : "1px solid var(--color-border)",
                  background: activeFilter === f ? "var(--gradient-brand)" : "transparent",
                  color: activeFilter === f ? "#fff" : "var(--color-text-muted)",
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "capitalize",
                  cursor: "pointer",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", borderTop: "1px solid var(--color-border)" }}>
          {filteredTickets.length === 0 ? (
            <p style={{ padding: 24, textAlign: "center", color: "var(--color-text-muted)", fontSize: 13 }}>
              No conversations match.
            </p>
          ) : (
            filteredTickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--color-border)",
                  cursor: "pointer",
                  background: selectedId === t.id ? "rgba(99,102,241,0.08)" : "transparent",
                  borderLeft: selectedId === t.id ? "3px solid var(--color-primary)" : "3px solid transparent",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>{t.customer}</span>
                  <PriorityBadge priority={t.priority} />
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--color-text-muted)",
                    marginBottom: 6,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.subject}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <StatusBadge status={t.status} />
                  <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{t.assignedTo}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Conversation detail */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!selectedTicket ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ color: "var(--color-text-muted)" }}>Select a conversation to get started.</p>
          </div>
        ) : (
          <>
            {/* Header: subject + status/priority/assignment controls */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--color-text)", marginBottom: 2 }}>
                    {selectedTicket.subject}
                  </h2>
                  <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{selectedTicket.id}</p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <select
                    style={selectStyle}
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                  >
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <select
                    style={selectStyle}
                    value={selectedTicket.priority}
                    onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <select
                    style={selectStyle}
                    value={selectedTicket.assignedTo}
                    onChange={(e) => handleAssignedToChange(e.target.value)}
                  >
                    <option>Unassigned</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {actionError && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>{actionError}</p>}
            </div>

            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              {/* Thread + reply */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                  {messagesLoading ? (
                    <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>Loading conversation...</p>
                  ) : messages.length === 0 ? (
                    <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
                      No messages yet — send the first reply below.
                    </p>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: m.sender === "agent" ? "flex-end" : "flex-start",
                          maxWidth: "75%",
                        }}
                      >
                        <div
                          style={{
                            background: m.sender === "agent" ? "var(--gradient-brand)" : "var(--color-card)",
                            color: m.sender === "agent" ? "#fff" : "var(--color-text)",
                            border: m.sender === "agent" ? "none" : "1px solid var(--color-border)",
                            borderRadius: 12,
                            padding: "10px 14px",
                            fontSize: 13.5,
                            lineHeight: 1.5,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {m.body}
                        </div>
                        <p
                          style={{
                            fontSize: 11,
                            color: "var(--color-text-muted)",
                            marginTop: 4,
                            textAlign: m.sender === "agent" ? "right" : "left",
                          }}
                        >
                          {m.authorName || (m.sender === "agent" ? "Agent" : selectedTicket.customer)} ·{" "}
                          {new Date(m.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border)" }}>
                  {sendError && <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 8 }}>{sendError}</p>}
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply to the customer..."
                      style={{
                        flex: 1,
                        minHeight: 60,
                        maxHeight: 160,
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid var(--color-border)",
                        fontSize: 13.5,
                        fontFamily: "inherit",
                        background: "var(--color-bg)",
                        color: "var(--color-text)",
                        resize: "vertical",
                      }}
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={sending || !replyText.trim()}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "var(--gradient-brand)",
                        color: "#fff",
                        border: "none",
                        padding: "11px 16px",
                        borderRadius: 10,
                        fontSize: 13.5,
                        fontWeight: 700,
                        cursor: sending || !replyText.trim() ? "default" : "pointer",
                        opacity: sending || !replyText.trim() ? 0.6 : 1,
                        boxShadow: "var(--shadow-elevated)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Send size={14} /> {sending ? "Sending..." : "Reply"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Customer context + internal notes */}
              <div
                style={{
                  width: 280,
                  flexShrink: 0,
                  borderLeft: "1px solid var(--color-border)",
                  overflowY: "auto",
                  padding: 20,
                }}
              >
                <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 10 }}>
                  Customer
                </h3>
                {customerRecord ? (
                  <div style={{ marginBottom: 22, display: "flex", flexDirection: "column", gap: 8 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>{customerRecord.name}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--color-text-muted)" }}>
                      <Mail size={13} /> {customerRecord.email || "—"}
                    </div>
                    {customerRecord.phone && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--color-text-muted)" }}>
                        <Phone size={13} /> {customerRecord.phone}
                      </div>
                    )}
                    {customerRecord.company && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--color-text-muted)" }}>
                        <Building2 size={13} /> {customerRecord.company}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 14, marginTop: 4, fontSize: 12 }}>
                      <span style={{ color: "var(--color-text-muted)" }}>
                        <strong style={{ color: "var(--color-text)" }}>{customerRecord.openTickets}</strong> open
                      </span>
                      <span style={{ color: "var(--color-text-muted)" }}>
                        <strong style={{ color: "var(--color-text)" }}>{customerRecord.totalTickets}</strong> total
                      </span>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginBottom: 22 }}>
                    No matching customer record for "{selectedTicket.customer}".
                  </p>
                )}

                <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 10 }}>
                  Internal Notes
                </h3>
                <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 8 }}>
                  Only visible to agents — never sent to the customer.
                </p>
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: 100,
                    padding: "9px 11px",
                    borderRadius: 8,
                    border: "1px solid var(--color-border)",
                    fontSize: 13,
                    fontFamily: "inherit",
                    background: "var(--color-bg)",
                    color: "var(--color-text)",
                    resize: "vertical",
                    marginBottom: 8,
                  }}
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={notesSaving}
                  style={{
                    background: "none",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                    padding: "7px 14px",
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: notesSaving ? "default" : "pointer",
                    opacity: notesSaving ? 0.6 : 1,
                  }}
                >
                  {notesSaving ? "Saving..." : "Save Notes"}
                </button>
                {notesMsg && <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, marginLeft: 10 }}>{notesMsg}</span>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Inbox;