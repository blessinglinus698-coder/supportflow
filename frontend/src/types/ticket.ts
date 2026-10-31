export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface Ticket {
  id: string;
  subject: string;
  customer: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo: string;
  updatedAt: string;
  notes: string;
}

// What's sent when creating a ticket: everything a Ticket has except the
// server-assigned fields, plus the customer's email. The email is only used
// on the backend to find-or-create the matching customer record — it's
// never stored on the ticket itself.
export type NewTicketInput = Omit<Ticket, "id" | "status" | "updatedAt" | "notes"> & {
  customerEmail: string;
};