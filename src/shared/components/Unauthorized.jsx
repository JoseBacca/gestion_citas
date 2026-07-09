import { Link } from "react-router-dom";
import { ShieldOff, Home } from "lucide-react";

export default function Unauthorized() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", padding: "var(--space-8)" }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ width: 80, height: 80, borderRadius: "var(--radius-full)", background: "var(--color-error-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-6)" }}><ShieldOff size={40} color="var(--color-error)" /></div>
        <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--gray-900)", marginBottom: "var(--space-3)" }}>403</h1>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--gray-700)", marginBottom: "var(--space-3)" }}>Acceso Denegado</h2>
        <p style={{ color: "var(--gray-500)", marginBottom: "var(--space-8)", lineHeight: 1.6 }}>No tienes permisos para ver esta pagina.</p>
        <Link to="/" className="btn-primary btn-lg" style={{ textDecoration: "none" }}><Home size={18} /> Volver al inicio</Link>
      </div>
    </div>
  );
}
