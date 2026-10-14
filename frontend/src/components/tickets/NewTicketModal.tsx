import { useState } from "react";
import { X } from "lucide-react";
import type { Ticket, TicketPriority } from "../../types/ticket";

interface NewTicketModalProps {
  onClose: () => void;
  onCreate: (ticket: Omit<Ticket, "id" | "status" | "updatedAt" | "notes">) => void;
}

function NewTicketModal({ onClose, onCreate }: NewTicketModalProps) {
  const [subject, setSubject] = useState("");
  const [customer, setCustomer] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [assignedTo, setAssignedTo] = useState("Unassigned");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !customer.trim()) return;

    onCreate({ subject, customer, priority, assignedTo });
    onClose();
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--color-border)",
    fontSize: 14,
    marginTop: 4,
    marginBottom: 14,
    fontFamily: "inherit",
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 40 }} />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "#fff",
          borderRadius: 16,
          padding: 26,
          width: 400,
          zIndex: 50,
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text)" }}>New Ticket</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 600 }}>Subject</label>
          <input style={inputStyle} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Can't log in" />

          <label style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 600 }}>Customer name</label>
          <input style={inputStyle} value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="e.g. Jane Doe" />

          <label style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 600 }}>Priority</label>
          <select style={inputStyle} value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <label style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 600 }}>Assign to</label>
          <select style={inputStyle} value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <option>Unassigned</option>
            <option>Blessing</option>
            <option>Chidi</option>
          </select>

          <button
            type="submit"
            style={{
              width: "100%",
              background: "var(--gradient-brand)",
              color: "#fff",
              border: "none",
              padding: "11px 0",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              marginTop: 6,
              boxShadow: "var(--shadow-elevated)",
            }}
          >
            Create Ticket
          </button>
        </form>
      </div>
    </>
  );
}

export default NewTicketModal;