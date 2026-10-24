import crypto from "crypto";
import pool from "../db.js";
import { sendMail } from "./mailer.js";

export async function createInAppNotification({ agentId, type, ticketId, message, urgent = false }) {
  try {
    const id = `NTF-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    await pool.query(
      `INSERT INTO notifications (id, "agentId", type, "ticketId", message, urgent, read, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, false, $7)`,
      [id, agentId, type, ticketId || null, message, urgent, new Date().toISOString()]
    );
  } catch (err) {
    console.error("Failed to create in-app notification:", err);
  }
}

export async function notifyNewTicket(ticket) {
  try {
    let recipients = [];

    const isAssigned = ticket.assignedTo && ticket.assignedTo !== "Unassigned";

    if (isAssigned) {
      const { rows } = await pool.query("SELECT email FROM agents WHERE name = $1", [ticket.assignedTo]);
      recipients = rows.map((r) => r.email);
    } else {
      const { rows } = await pool.query("SELECT email FROM agents WHERE role = 'admin'");
      recipients = rows.map((r) => r.email);
    }

    for (const email of recipients) {
      await sendMail({
        to: email,
        subject: `New ticket: ${ticket.subject}`,
        html: `<p>A new ticket has been ${isAssigned ? "assigned to you" : "created and needs an owner"}:</p>
               <p><strong>${ticket.subject}</strong><br/>Customer: ${ticket.customer}<br/>Priority: ${ticket.priority}</p>`,
      });
    }
  } catch (err) {
    console.error("Failed to send new-ticket notification:", err);
  }
}

export async function notifyTicketResolved(ticket) {
  try {
    const { rows } = await pool.query("SELECT email FROM customers WHERE name = $1", [ticket.customer]);
    const customerEmail = rows[0]?.email;

    if (!customerEmail) {
      console.warn(
        `[mailer] No matching customer record found for "${ticket.customer}" — skipping resolved-ticket email`
      );
      return;
    }

    await sendMail({
      to: customerEmail,
      subject: `Your ticket has been resolved: ${ticket.subject}`,
      html: `<p>Hi ${ticket.customer},</p><p>Good news — your support ticket "<strong>${ticket.subject}</strong>" has been marked as resolved.</p><p>If you still need help, just reply to let us know.</p>`,
    });
  } catch (err) {
    console.error("Failed to send ticket-resolved notification:", err);
  }
}

// Fires when a ticket's assignedTo changes to a specific agent (not
// "Unassigned", and different from whoever had it before). Sends both an
// urgent in-app notification and an email.
export async function notifyTicketAssigned(ticket, previousAssignedTo) {
  if (!ticket.assignedTo || ticket.assignedTo === "Unassigned") return;
  if (ticket.assignedTo === previousAssignedTo) return;

  try {
    const { rows } = await pool.query("SELECT * FROM agents WHERE name = $1", [ticket.assignedTo]);
    const agent = rows[0];
    if (!agent) return;

    await createInAppNotification({
      agentId: agent.id,
      type: "ticket_assigned",
      ticketId: ticket.id,
      message: `You've been assigned ticket "${ticket.subject}" (${ticket.customer})`,
      urgent: true,
    });

    await sendMail({
      to: agent.email,
      subject: `[Urgent] You've been assigned: ${ticket.subject}`,
      html: `<p>Hi ${agent.name},</p><p>You've just been assigned a ticket:</p><p><strong>${ticket.subject}</strong><br/>Customer: ${ticket.customer}<br/>Priority: ${ticket.priority}</p>`,
    });
  } catch (err) {
    console.error("Failed to send ticket-assigned notification:", err);
  }
}