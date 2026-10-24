import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Ticket, TicketStatus, TicketPriority } from "../types/ticket";
import { useAuth } from "./AuthContext";

const API_URL = "http://localhost:5000/api/tickets";

interface TicketsContextValue {
  tickets: Ticket[];
  loading: boolean;
  addTicket: (ticket: Omit<Ticket, "id" | "status" | "updatedAt" | "notes">) => Promise<void>;
  updateTicketNotes: (id: string, notes: string) => Promise<void>;
  updateTicketStatus: (id: string, status: TicketStatus) => Promise<void>;
  updateTicketPriority: (id: string, priority: TicketPriority) => Promise<void>;
  updateTicketAssignedTo: (id: string, assignedTo: string) => Promise<void>;
  suggestReply: (id: string) => Promise<string>;
}

const TicketsContext = createContext<TicketsContextValue | undefined>(undefined);

export function TicketsProvider({ children }: { children: ReactNode }) {
  const { token, logout } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const authHeaders = useCallback(
    (extra: Record<string, string> = {}) => ({ ...extra, Authorization: `Bearer ${token}` }),
    [token]
  );

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on logout
      setTickets([]);
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
      .then((data) => setTickets(data))
      .catch((err) => console.error("Failed to load tickets:", err))
      .finally(() => setLoading(false));
  }, [token, authHeaders, logout]);

  // Shared by every PATCH-based update below. On a rejected request (bad
  // status transition, invalid priority, etc.) this throws instead of
  // writing the error response into the tickets array — a bad write used to
  // silently replace a real ticket with an {error: "..."} object, which then
  // crashed any component rendering its (now-missing) fields.
  async function patchTicket(id: string, body: Record<string, unknown>): Promise<Ticket> {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PATCH",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to update ticket");
    }
    setTickets((prev) => prev.map((t) => (t.id === id ? data : t)));
    return data;
  }

  async function addTicket(ticket: Omit<Ticket, "id" | "status" | "updatedAt" | "notes">) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(ticket),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to create ticket");
    }
    setTickets((prev) => [data, ...prev]);
  }

  async function updateTicketNotes(id: string, notes: string) {
    await patchTicket(id, { notes });
  }

  async function updateTicketStatus(id: string, status: TicketStatus) {
    await patchTicket(id, { status });
  }

  async function updateTicketPriority(id: string, priority: TicketPriority) {
    await patchTicket(id, { priority });
  }

  async function updateTicketAssignedTo(id: string, assignedTo: string) {
    await patchTicket(id, { assignedTo });
  }

  async function suggestReply(id: string): Promise<string> {
    const res = await fetch(`${API_URL}/${id}/suggest-reply`, {
      method: "POST",
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to generate reply");
    }
    return data.reply;
  }

  return (
    <TicketsContext.Provider
      value={{
        tickets,
        loading,
        addTicket,
        updateTicketNotes,
        updateTicketStatus,
        updateTicketPriority,
        updateTicketAssignedTo,
        suggestReply,
      }}
    >
      {children}
    </TicketsContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketsContext);
  if (!context) {
    throw new Error("useTickets must be used within a TicketsProvider");
  }
  return context;
}