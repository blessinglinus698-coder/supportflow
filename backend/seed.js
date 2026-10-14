import db from "./db.js";

const mockTickets = [
  { id: "TCK-1042", subject: "Can't reset password", customer: "Amaka Obi", status: "open", priority: "high", assignedTo: "Blessing", updatedAt: new Date().toISOString() },
  { id: "TCK-1041", subject: "Billing charged twice", customer: "John Adeyemi", status: "pending", priority: "urgent", assignedTo: "Chidi", updatedAt: new Date().toISOString() },
  { id: "TCK-1040", subject: "Feature request: dark mode", customer: "Sarah Lee", status: "open", priority: "low", assignedTo: "Unassigned", updatedAt: new Date().toISOString() },
  { id: "TCK-1039", subject: "App crashes on login", customer: "Tunde Bakare", status: "open", priority: "urgent", assignedTo: "Blessing", updatedAt: new Date().toISOString() },
  { id: "TCK-1038", subject: "Refund request", customer: "Grace Okonkwo", status: "resolved", priority: "medium", assignedTo: "Chidi", updatedAt: new Date().toISOString() },
  { id: "TCK-1037", subject: "How do I export my data?", customer: "Michael Obi", status: "closed", priority: "low", assignedTo: "Blessing", updatedAt: new Date().toISOString() },
];

const insert = db.prepare(
  "INSERT OR IGNORE INTO tickets (id, subject, customer, status, priority, assignedTo, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
);

for (const t of mockTickets) {
  insert.run(t.id, t.subject, t.customer, t.status, t.priority, t.assignedTo, t.updatedAt);
}

console.log("Seeded", mockTickets.length, "tickets.");


const mockCustomers = [
  { id: "CUS-001", name: "Amaka Obi", email: "amaka.obi@mail.com", company: "Zenith Retail", openTickets: 1, totalTickets: 4, joined: "Jan 2025" },
  { id: "CUS-002", name: "John Adeyemi", email: "j.adeyemi@mail.com", company: "Lagos Freight Co.", openTickets: 1, totalTickets: 7, joined: "Mar 2024" },
  { id: "CUS-003", name: "Sarah Lee", email: "sarah.lee@mail.com", company: "Brightline Media", openTickets: 1, totalTickets: 2, joined: "Aug 2025" },
  { id: "CUS-004", name: "Tunde Bakare", email: "tunde.b@mail.com", company: "PayHive", openTickets: 1, totalTickets: 5, joined: "Feb 2025" },
  { id: "CUS-005", name: "Grace Okonkwo", email: "grace.o@mail.com", company: "Okonkwo Designs", openTickets: 0, totalTickets: 3, joined: "Nov 2024" },
  { id: "CUS-006", name: "Michael Obi", email: "michael.obi@mail.com", company: "Independent", openTickets: 0, totalTickets: 1, joined: "Jun 2025" },
];

const mockAgents = [
  { id: "AGT-001", name: "Blessing", email: "blessing@supportflow.app", role: "admin", createdAt: new Date().toISOString() },
  { id: "AGT-002", name: "Chidi", email: "chidi@supportflow.app", role: "agent", createdAt: new Date().toISOString() },
];

const insertAgent = db.prepare(
  "INSERT OR IGNORE INTO agents (id, name, email, role, createdAt) VALUES (?, ?, ?, ?, ?)"
);

for (const a of mockAgents) {
  insertAgent.run(a.id, a.name, a.email, a.role, a.createdAt);
}

console.log("Seeded", mockAgents.length, "agents.");


const insertCustomer = db.prepare(
  "INSERT OR IGNORE INTO customers (id, name, email, company, openTickets, totalTickets, joined) VALUES (?, ?, ?, ?, ?, ?, ?)"
);

for (const c of mockCustomers) {
  insertCustomer.run(c.id, c.name, c.email, c.company, c.openTickets, c.totalTickets, c.joined);
}

console.log("Seeded", mockCustomers.length, "customers.");