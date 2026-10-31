import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { StatusBadge, PriorityBadge } from "../components/tickets/Badges";
import type { TicketStatus, TicketPriority } from "../types/ticket";

const API_URL = "http://localhost:5000/api/analytics";

interface AnalyticsData {
  range: { from: string; to: string };
  totals: { totalTickets: number; openTickets: number; resolvedTickets: number };
  avgResolutionHours: number | null;
  ticketsOverTime: { date: string; count: number }[];
  statusBreakdown: Record<TicketStatus, number>;
  priorityBreakdown: Record<TicketPriority, number>;
  byAgent: { name: string; count: number }[];
  topCustomers: { name: string; count: number }[];
}

type RangeOption = "7" | "30" | "90" | "custom";

function formatDuration(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  if (hours < 48) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISODate(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function Analytics() {
  const { token } = useAuth();
  const [range, setRange] = useState<RangeOption>("30");
  const [customFrom, setCustomFrom] = useState(daysAgoISODate(30));
  const [customTo, setCustomTo] = useState(todayISODate());

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const authHeaders = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ range });
      if (range === "custom") {
        params.set("from", customFrom);
        params.set("to", customTo);
      }
      const res = await fetch(`${API_URL}?${params.toString()}`, { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load analytics");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [range, customFrom, customTo, authHeaders]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch triggered by range change, not synchronous state churn
    loadAnalytics();
  }, [loadAnalytics]);

  const cardStyle: React.CSSProperties = {
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
    borderRadius: 14,
    padding: 22,
    boxShadow: "var(--shadow-card)",
  };

  const statCardStyle: React.CSSProperties = {
    ...cardStyle,
    flex: "1 1 160px",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    color: "var(--color-text)",
    marginBottom: 16,
  };

  const maxDayCount = data ? Math.max(1, ...data.ticketsOverTime.map((d) => d.count)) : 1;
  const maxStatusCount = data ? Math.max(1, ...Object.values(data.statusBreakdown)) : 1;
  const maxPriorityCount = data ? Math.max(1, ...Object.values(data.priorityBreakdown)) : 1;
  const maxAgentCount = data && data.byAgent.length > 0 ? Math.max(...data.byAgent.map((a) => a.count)) : 1;
  const maxCustomerCount =
    data && data.topCustomers.length > 0 ? Math.max(...data.topCustomers.map((c) => c.count)) : 1;

  return (
    <div style={{ padding: 28, background: "var(--color-bg)", minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)" }}>Analytics</h1>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {(["7", "30", "90"] as RangeOption[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: "7px 14px",
                borderRadius: 999,
                border: range === r ? "none" : "1px solid var(--color-border)",
                background: range === r ? "var(--gradient-brand)" : "var(--color-card)",
                color: range === r ? "#fff" : "var(--color-text-muted)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Last {r} days
            </button>
          ))}
          <button
            onClick={() => setRange("custom")}
            style={{
              padding: "7px 14px",
              borderRadius: 999,
              border: range === "custom" ? "none" : "1px solid var(--color-border)",
              background: range === "custom" ? "var(--gradient-brand)" : "var(--color-card)",
              color: range === "custom" ? "#fff" : "var(--color-text-muted)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Custom
          </button>
          {range === "custom" && (
            <>
              <input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                  fontSize: 13,
                  background: "var(--color-card)",
                  color: "var(--color-text)",
                }}
              />
              <span style={{ color: "var(--color-text-muted)", fontSize: 13 }}>to</span>
              <input
                type="date"
                value={customTo}
                min={customFrom}
                max={todayISODate()}
                onChange={(e) => setCustomTo(e.target.value)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                  fontSize: 13,
                  background: "var(--color-card)",
                  color: "var(--color-text)",
                }}
              />
            </>
          )}
        </div>
      </div>

      {error && (
        <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 16 }}>{error}</p>
      )}

      {loading || !data ? (
        <p style={{ color: "var(--color-text-muted)" }}>Loading analytics...</p>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
            <div style={statCardStyle}>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600, marginBottom: 6 }}>
                Total Tickets
              </p>
              <p style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text)" }}>{data.totals.totalTickets}</p>
            </div>
            <div style={statCardStyle}>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600, marginBottom: 6 }}>
                Open Tickets
              </p>
              <p style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text)" }}>{data.totals.openTickets}</p>
            </div>
            <div style={statCardStyle}>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600, marginBottom: 6 }}>
                Resolved Tickets
              </p>
              <p style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text)" }}>{data.totals.resolvedTickets}</p>
            </div>
            <div style={statCardStyle}>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600, marginBottom: 6 }}>
                Avg. Resolution Time
              </p>
              <p style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text)" }}>
                {formatDuration(data.avgResolutionHours)}
              </p>
            </div>
          </div>

          {/* Tickets over time */}
          <div style={{ ...cardStyle, marginBottom: 20 }}>
            <h2 style={sectionTitleStyle}>Tickets Created Over Time</h2>
            {data.ticketsOverTime.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>No tickets in this range.</p>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 150, overflowX: "auto", paddingBottom: 4 }}>
                {data.ticketsOverTime.map((d) => (
                  <div
                    key={d.date}
                    title={`${d.date}: ${d.count}`}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 22, flexShrink: 0 }}
                  >
                    <span style={{ fontSize: 10, color: "var(--color-text-muted)", marginBottom: 4 }}>{d.count}</span>
                    <div
                      style={{
                        width: 14,
                        height: Math.max(3, (d.count / maxDayCount) * 100),
                        background: "var(--gradient-brand)",
                        borderRadius: 4,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 9,
                        color: "var(--color-text-muted)",
                        marginTop: 6,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {d.date.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
            {/* Status breakdown */}
            <div style={{ ...cardStyle, flex: "1 1 320px" }}>
              <h2 style={sectionTitleStyle}>By Status</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(Object.keys(data.statusBreakdown) as TicketStatus[]).map((status) => (
                  <div key={status}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <StatusBadge status={status} />
                      <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                        {data.statusBreakdown[status]}
                      </span>
                    </div>
                    <div style={{ height: 6, background: "var(--color-bg)", borderRadius: 999, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${(data.statusBreakdown[status] / maxStatusCount) * 100}%`,
                          background: "var(--gradient-brand)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority breakdown */}
            <div style={{ ...cardStyle, flex: "1 1 320px" }}>
              <h2 style={sectionTitleStyle}>By Priority</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(Object.keys(data.priorityBreakdown) as TicketPriority[]).map((priority) => (
                  <div key={priority}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <PriorityBadge priority={priority} />
                      <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                        {data.priorityBreakdown[priority]}
                      </span>
                    </div>
                    <div style={{ height: 6, background: "var(--color-bg)", borderRadius: 999, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${(data.priorityBreakdown[priority] / maxPriorityCount) * 100}%`,
                          background: "var(--gradient-brand)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {/* Tickets by agent */}
            <div style={{ ...cardStyle, flex: "1 1 320px" }}>
              <h2 style={sectionTitleStyle}>Tickets by Agent</h2>
              {data.byAgent.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>No tickets in this range.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {data.byAgent.map((a) => (
                    <div key={a.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{a.name}</span>
                        <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{a.count}</span>
                      </div>
                      <div style={{ height: 6, background: "var(--color-bg)", borderRadius: 999, overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${(a.count / maxAgentCount) * 100}%`,
                            background: "var(--gradient-brand)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top customers */}
            <div style={{ ...cardStyle, flex: "1 1 320px" }}>
              <h2 style={sectionTitleStyle}>Top Customers</h2>
              {data.topCustomers.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>No tickets in this range.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {data.topCustomers.map((c) => (
                    <div key={c.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{c.name}</span>
                        <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{c.count} tickets</span>
                      </div>
                      <div style={{ height: 6, background: "var(--color-bg)", borderRadius: 999, overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${(c.count / maxCustomerCount) * 100}%`,
                            background: "var(--gradient-brand)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Analytics;