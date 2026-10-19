import { Routes, Route } from "react-router-dom";
import type { ReactNode } from "react";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import Dashboard from "./pages/Dashboard";
import Tickets from "./pages/Tickets";
import Customers from "./pages/Customers";
import Inbox from "./pages/Inbox";
import Knowledge from "./pages/Knowledge";
import Analytics from "./pages/Analytics";
import Onboarding from "./pages/Onboarding";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Topbar />
        <div style={{ flex: 1, overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tickets" element={<Tickets />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/inbox" element={<Inbox />} />
                <Route path="/knowledge" element={<Knowledge />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route
                  path="/onboarding"
                  element={
                    <AdminRoute>
                      <Onboarding />
                    </AdminRoute>
                  }
                />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;