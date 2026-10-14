function Topbar() {
  return (
    <header
      style={{
        height: 64,
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        background: "#ffffff",
      }}
    >
      <h1 style={{ fontSize: 19, fontWeight: 700, color: "var(--color-text)" }}>Dashboard</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 14, color: "var(--color-text-muted)", fontWeight: 500 }}>
          Agent: Blessing
        </span>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          B
        </div>
      </div>
    </header>
  );
}

export default Topbar;