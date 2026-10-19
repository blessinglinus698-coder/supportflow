import { LogOut } from "lucide-react";
import { useProfile } from "../../context/ProfileContext";
import { useAuth } from "../../context/AuthContext";
import LiveClock from "./LiveClock";

function Topbar() {
  const { name, photoUrl } = useProfile();
  const { logout } = useAuth();

  return (
    <header
      style={{
        height: 64,
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        background: "var(--color-card)",
      }}
    >
      <LiveClock />
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 14, color: "var(--color-text-muted)", fontWeight: 500 }}>
          Agent: {name}
        </span>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: photoUrl ? `url(${photoUrl}) center/cover` : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {!photoUrl && name.charAt(0).toUpperCase()}
        </div>
        <button
          onClick={logout}
          title="Log out"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            borderRadius: 8,
            border: "1px solid var(--color-border)",
            background: "var(--color-bg)",
            color: "var(--color-text-muted)",
            cursor: "pointer",
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}

export default Topbar;