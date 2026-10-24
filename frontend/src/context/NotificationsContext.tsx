import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "./AuthContext";

export interface AppNotification {
  id: string;
  agentId: string;
  type: string;
  ticketId: string | null;
  message: string;
  urgent: boolean;
  read: boolean;
  createdAt: string;
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const API_URL = "http://localhost:5000/api/notifications";

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { token, logout } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const authHeaders = useCallback(
    (extra: Record<string, string> = {}) => ({ ...extra, Authorization: `Bearer ${token}` }),
    [token]
  );

  // Background refresh — does not touch the loading flag, just silently
  // updates the list. Used for polling and after a notification is created
  // elsewhere in the app.
  const refreshNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(API_URL, { headers: authHeaders() });
      if (res.status === 401) {
        logout();
        return;
      }
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to refresh notifications:", err);
    }
  }, [token, authHeaders, logout]);

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on logout
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    refreshNotifications().finally(() => setLoading(false));
  }, [token, refreshNotifications]);

  // Poll for new notifications every 30 seconds while logged in.
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(refreshNotifications, 30000);
    return () => clearInterval(interval);
  }, [token, refreshNotifications]);

  async function markAsRead(id: string) {
    await fetch(`${API_URL}/${id}/read`, {
      method: "PATCH",
      headers: authHeaders(),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  async function markAllAsRead() {
    await fetch(`${API_URL}/read-all`, {
      method: "PATCH",
      headers: authHeaders(),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, loading, markAsRead, markAllAsRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}