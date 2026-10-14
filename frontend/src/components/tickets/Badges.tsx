import type { TicketStatus, TicketPriority } from "../../types/ticket";

const statusColors: Record<TicketStatus, { bg: string; text: string }> = {
  open: { bg: "#e0e7ff", text: "#4338ca" },
  pending: { bg: "#fef3c7", text: "#b45309" },
  resolved: { bg: "#dcfce7", text: "#15803d" },
  closed: { bg: "#e2e8f0", text: "#475569" },
};

const priorityColors: Record<TicketPriority, { bg: string; text: string }> = {
  low: { bg: "#f1f5f9", text: "#64748b" },
  medium: { bg: "#e0e7ff", text: "#4338ca" },
  high: { bg: "#fed7aa", text: "#c2410c" },
  urgent: { bg: "#fecaca", text: "#b91c1c" },
};

function badgeStyle(bg: string, text: string): React.CSSProperties {
  return {
    background: bg,
    color: text,
    fontSize: 12,
    fontWeight: 700,
    padding: "4px 11px",
    borderRadius: 999,
    textTransform: "capitalize",
    display: "inline-block",
    letterSpacing: "0.2px",
  };
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  const c = statusColors[status];
  return <span style={badgeStyle(c.bg, c.text)}>{status}</span>;
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const c = priorityColors[priority];
  return <span style={badgeStyle(c.bg, c.text)}>{priority}</span>;
}