function AgentWorkload() {
  return (
    <div
      style={{
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 14,
        padding: 20,
        boxShadow: "var(--shadow-card)",
      }}
    >
      <h3 style={{ marginBottom: 12, fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>
        Agent Workload
      </h3>
      <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
        Coming next.
      </p>
    </div>
  );
}

export default AgentWorkload;