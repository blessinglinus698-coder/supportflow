function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 1, paddingLeft: 8 }}>
      <span
        style={{
          fontSize: 26,
          fontWeight: 800,
          background: "linear-gradient(135deg, #818cf8 0%, #c4b5fd 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          letterSpacing: "-0.5px",
        }}
      >
        S
      </span>
      <span style={{ fontSize: 17, fontWeight: 400, color: "#cbd5e1", letterSpacing: "0.2px" }}>
        upport
      </span>
      <span
        style={{
          fontSize: 26,
          fontWeight: 800,
          background: "linear-gradient(135deg, #818cf8 0%, #c4b5fd 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          letterSpacing: "-0.5px",
          marginLeft: 2,
        }}
      >
        F
      </span>
      <span style={{ fontSize: 17, fontWeight: 400, color: "#cbd5e1", letterSpacing: "0.2px" }}>
        low
      </span>
    </div>
  );
}

export default Logo;