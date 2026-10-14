interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
}

function StatCard({ label, value, change }: StatCardProps) {
  return (
    <div
      style={{
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 14,
        padding: 20,
        flex: 1,
        boxShadow: "var(--shadow-card)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: 3,
          background: "var(--gradient-brand)",
        }}
      />
      <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 8, fontWeight: 500 }}>
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.5px" }}>
        {value}
      </p>
      {change && (
        <p style={{ fontSize: 12, color: "#16a34a", marginTop: 6, fontWeight: 600 }}>{change}</p>
      )}
    </div>
  );
}

export default StatCard;