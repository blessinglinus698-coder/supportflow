import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useNotifications, type AppNotification } from "../../context/NotificationsContext";
import { useTickets } from "../../context/TicketsContext";
import { StatusBadge, PriorityBadge } from "../tickets/Badges";

function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { tickets } = useTickets();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  function handleNotificationClick(n: AppNotification) {
    if (!n.read) markAsRead(n.id);
    if (n.ticketId) {
      setOpen(false);
      navigate(`/tickets?ticketId=${n.ticketId}`);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--color-text-muted)",
          padding: 6,
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              background: "#ef4444",
              color: "#fff",
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 700,
              minWidth: 16,
              height: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: 360,
              maxHeight: 420,
              overflowY: "auto",
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              boxShadow: "var(--shadow-elevated)",
              zIndex: 50,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13, color: "var(--color-text)" }}>Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-primary)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <p style={{ padding: 20, textAlign: "center", color: "var(--color-text-muted)", fontSize: 13 }}>
                No notifications yet.
              </p>
            ) : (
              notifications.map((n) => {
                const relatedTicket = n.ticketId ? tickets.find((t) => t.id === n.ticketId) : undefined;

                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    style={{
                      padding: "12px 14px",
                      borderBottom: "1px solid var(--color-border)",
                      background: n.read ? "transparent" : "rgba(99,102,241,0.06)",
                      cursor: n.ticketId ? "pointer" : "default",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      {n.urgent && (
                        <span
                          style={{
                            background: "#ef4444",
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 999,
                            textTransform: "uppercase",
                            letterSpacing: "0.3px",
                          }}
                        >
                          Urgent
                        </span>
                      )}
                      {!n.read && (
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-primary)" }} />
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: "var(--color-text)", lineHeight: 1.4 }}>{n.message}</p>

                    {relatedTicket && (
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <PriorityBadge priority={relatedTicket.priority} />
                        <StatusBadge status={relatedTicket.status} />
                      </div>
                    )}

                    <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 6 }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;