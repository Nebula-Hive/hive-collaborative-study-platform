import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ allowedRoles } = {}) {
  const { isAuthenticated, loading, role } = useAuth();

  if (loading) return null; // or <Spinner />
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}