import { NavLink } from "react-router-dom";
import { LayoutDashboard, Ticket, Users, Inbox, BookOpen, BarChart3, Settings as SettingsIcon, UserCog } from "lucide-react";
import Logo from "./logo"
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Tickets", icon: Ticket, path: "/tickets" },
  { label: "Customers", icon: Users, path: "/customers" },
  { label: "Inbox", icon: Inbox, path: "/inbox" },
  { label: "Knowledge", icon: BookOpen, path: "/knowledge" },
  { label: "Analytics", icon: BarChart3, path: "/analytics" },
  { label: "Onboarding", icon: UserCog, path: "/onboarding", adminOnly: true },
  { label: "Settings", icon: SettingsIcon, path: "/settings" },
];

function Sidebar() {
  const { agent } = useAuth();
  const isAdmin = agent?.role === "admin";
  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside
      style={{
        width: 230,
        height: "100vh",
        background: "linear-gradient(180deg, #0f172a 0%, #131b31 100%)",
        color: "#fff",
        padding: "20px 14px",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <Logo />
      </div>
      <nav>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                color: isActive ? "#fff" : "#94a3b8",
                background: isActive
                  ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
                  : "transparent",
                boxShadow: isActive ? "0 2px 8px rgba(99,102,241,0.35)" : "none",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                marginBottom: 4,
                transition: "all 0.15s ease",
              })}
            >
              <Icon size={17} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;