import StatCard from "../components/dashboard/StatCard";
import PriorityTickets from "../components/dashboard/PriorityTickets";
import AgentWorkload from "../components/dashboard/AgentWorkload";
import { useTickets } from "../context/TicketsContext";

function Dashboard() {
  const { tickets } = useTickets();

  const openCount = tickets.filter((t) => t.status === "open").length;
  const urgentCount = tickets.filter((t) => t.priority === "urgent").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;

  return (
    <div style={{ padding: 28, background: "var(--color-bg)", minHeight: "calc(100vh - 64px)" }}>
      <div style={{ display: "flex", gap: 18, marginBottom: 28 }}>
        <StatCard label="Open Tickets" value={openCount} />
        <StatCard label="Urgent Tickets" value={urgentCount} />
        <StatCard label="Resolved / Closed" value={resolvedCount} />
        <StatCard label="Total Tickets" value={tickets.length} />
      </div>
      <div style={{ display: "flex", gap: 18 }}>
        <div style={{ flex: 2 }}>
          <PriorityTickets />
        </div>
        <div style={{ flex: 1 }}>
          <AgentWorkload />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;