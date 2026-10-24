import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { useTickets } from "../context/TicketsContext";
import { StatusBadge, PriorityBadge } from "../components/tickets/Badges";
import TicketDetail from "../components/tickets/TicketDetail";
import NewTicketModal from "../components/tickets/NewTicketModal";
import type { TicketStatus } from "../types/ticket";

const filters: (TicketStatus | "all")[] = ["all", "open", "pending", "resolved", "closed"];

function Tickets() {
  const { tickets, addTicket } = useTickets();
  const [activeFilter, setActiveFilter] = useState<TicketStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Lets a notification link (e.g. /tickets?ticketId=TCK-123) open that
  // ticket's detail panel directly, then clears the param so it doesn't
  // stick around once consumed.
  useEffect(() => {
    const ticketIdFromUrl = searchParams.get("ticketId");
    if (ticketIdFromUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: open ticket linked from a notification
      setSelectedTicketId(ticketIdFromUrl);
      searchParams.delete("ticketId");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = activeFilter === "all" || t.status === activeFilter;
    const matchesSearch =
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div style={{ padding: 28, background: "var(--color-bg)", minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)" }}>Tickets</h1>
        <button
          onClick={() => setShowNewModal(true)}
          style={{
            background: "var(--gradient-brand)",
            color: "#fff",
            border: "none",
            padding: "10px 18px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          + New Ticket
        </button>
      </div>

      <div style={{ position: "relative", marginBottom: 16, maxWidth: 340 }}>
        <Search size={16} style={{ position: "absolute", top: 12, left: 12, color: "var(--color-text-muted)" }} />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by subject or customer..."
          style={{
            width: "100%",
            padding: "10px 12px 10px 36px",
            borderRadius: 10,
            border: "1px solid var(--color-border)",
            fontSize: 14,
            background: "#fff",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              padding: "7px 16px",
              borderRadius: 999,
              border: activeFilter === f ? "none" : "1px solid var(--color-border)",
              background: activeFilter === f ? "var(--gradient-brand)" : "#fff",
              color: activeFilter === f ? "#fff" : "var(--color-text-muted)",
              fontSize: 13,
              fontWeight: 600,
              textTransform: "capitalize",
              cursor: "pointer",
              boxShadow: activeFilter === f ? "0 2px 8px rgba(99,102,241,0.3)" : "none",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left" }}>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.4px" }}>ID</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.4px" }}>Subject</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.4px" }}>Customer</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.4px" }}>Status</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.4px" }}>Priority</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.4px" }}>Assigned To</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.4px" }}>Updated</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((t) => (
              <tr
                key={t.id}
                onClick={() => setSelectedTicketId(t.id)}
                style={{ borderTop: "1px solid var(--color-border)", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "12px 16px", color: "var(--color-text-muted)", fontSize: 13 }}>{t.id}</td>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--color-text)" }}>{t.subject}</td>
                <td style={{ padding: "12px 16px" }}>{t.customer}</td>
                <td style={{ padding: "12px 16px" }}><StatusBadge status={t.status} /></td>
                <td style={{ padding: "12px 16px" }}><PriorityBadge priority={t.priority} /></td>
                <td style={{ padding: "12px 16px" }}>{t.assignedTo}</td>
                <td style={{ padding: "12px 16px", color: "var(--color-text-muted)", fontSize: 13 }}>{t.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTickets.length === 0 && (
          <p style={{ padding: 32, textAlign: "center", color: "var(--color-text-muted)" }}>
            No tickets match your search or filter.
          </p>
        )}
      </div>

      <TicketDetail ticketId={selectedTicketId} onClose={() => setSelectedTicketId(null)} />

      {showNewModal && (
        <NewTicketModal
          onClose={() => setShowNewModal(false)}
          onCreate={addTicket}
        />
      )}
    </div>
  );
}

export default Tickets;