import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

function AdminRoute({ children }: { children: ReactNode }) {
  const { agent } = useAuth();

  if (!agent || agent.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default AdminRoute;