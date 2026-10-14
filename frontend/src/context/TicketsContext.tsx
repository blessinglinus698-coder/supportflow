import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Ticket } from "../types/ticket";

const API_URL = "http://localhost:5000/api/tickets";

interface TicketsContextValue {
  tickets: Ticket[];
  loading: boolean;
  addTicket: (ticket: Omit<Ticket, "id" | "status" | "updatedAt" | "notes">) => Promise<void>;
  updateTicketNotes: (id: string, notes: string) => Promise<void>;
  suggestReply: (id: string) => Promise<string>;
}

const TicketsContext = createContext<TicketsContextValue | undefined>(undefined);

export function TicketsProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setTickets(data))
      .catch((err) => console.error("Failed to load tickets:", err))
      .finally(() => setLoading(false));
  }, []);

  async function addTicket(ticket: Omit<Ticket, "id" | "status" | "updatedAt" | "notes">) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ticket),
    });
    const newTicket = await res.json();
    setTickets((prev) => [newTicket, ...prev]);
  }

  async function updateTicketNotes(id: string, notes: string) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    const updated = await res.json();
    setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }

  
  async function suggestReply(id: string): Promise<string> {
    const res = await fetch(`${API_URL}/${id}/suggest-reply`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to generate reply");
    }
    return data.reply;
  }

  
  return (
    <TicketsContext.Provider value={{ tickets, loading, addTicket, updateTicketNotes, suggestReply }}>
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