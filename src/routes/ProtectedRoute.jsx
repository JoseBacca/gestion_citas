import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/Authproviders";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children, requiredRoles = null, fallback = "/login" }) {
    const { user, loading, hasRole } = useAuth();
    const location = useLocation();
    if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "var(--bg)" }}><div style={{ textAlign: "center" }}><Loader2 size={32} className="spin" color="var(--primary)" /><p style={{ marginTop: "1rem", color: "var(--gray-500)", fontSize: "var(--text-sm)" }}>Verificando sesion...</p></div></div>;
    if (!user) return <Navigate to={fallback} state={{ from: location }} replace />;
    if (requiredRoles && !hasRole(requiredRoles)) return <Navigate to="/unauthorized" replace />;
    return children;
}
