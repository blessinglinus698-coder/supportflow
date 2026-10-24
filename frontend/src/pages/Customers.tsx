import { useCustomers } from "../context/CustomersContext";

function Customers() {
  const { customers, loading } = useCustomers();

  return (
    <div style={{ padding: 28, background: "var(--color-bg)", minHeight: "100%" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)", marginBottom: 22 }}>
        Customers
      </h1>

      {loading ? (
        <p style={{ color: "var(--color-text-muted)" }}>Loading customers...</p>
      ) : (
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
                <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.4px" }}>Name</th>
                <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.4px" }}>Email</th>
                <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.4px" }}>Company</th>
                <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.4px" }}>Open Tickets</th>
                <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.4px" }}>Total Tickets</th>
                <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.4px" }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  style={{ borderTop: "1px solid var(--color-border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")} 
                >
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--color-text)" }}>{c.name}</td>
                  <td style={{ padding: "12px 16px", color: "var(--color-text-muted)" }}>{c.email}</td>
                  <td style={{ padding: "12px 16px" }}>{c.company}</td>
                  <td style={{ padding: "12px 16px" }}>{c.openTickets}</td>
                  <td style={{ padding: "12px 16px" }}>{c.totalTickets}</td>
                  <td style={{ padding: "12px 16px", color: "var(--color-text-muted)" }}>{c.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length === 0 && (
            <p style={{ padding: 32, textAlign: "center", color: "var(--color-text-muted)" }}>
              No customers yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Customers;