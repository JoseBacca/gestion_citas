import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../providers/Authproviders";
import { useTheme } from "../../providers/ThemeContext";
import { NotificationBell } from "./NotificationBell";
import {
    LogOut, User, Calendar, LayoutDashboard, Shield,
    Menu, X, ClipboardCheck, Building2, Home, BookOpen, FileText,
    Sun, Moon
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const ROLE_LABELS = {
    APRENDIZ: "Aprendiz",
    PSICOLOGIA: "Psicologia",
    ENFERMERIA: "Enfermeria",
    TRABAJO_SOCIAL: "Trabajo Social",
    COORDINACION: "Coordinacion",
    SUPERADMIN: "Administrador",
};

export default function Sidebar() {
    const { user, profile, signOut, isAdmin, isCoordination, isProfessional, isAprendiz } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [pendingCount, setPendingCount] = useState(0);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        if (!user) return;
        const loadCount = async () => {
            const { count } = await supabase
                .from("appointments")
                .select("id", { count: "exact", head: true })
                .eq(isAprendiz() ? "user_id" : "professional_id", user.id)
                .eq("status", "pending");
            setPendingCount(count || 0);
        };
        loadCount();
        const interval = setInterval(loadCount, 30000);
        return () => clearInterval(interval);
    }, [user, isAprendiz]);

    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    if (!user) return null;

    const handleLogout = async () => {
        await signOut();
        navigate("/login");
    };

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");
    const initials = (profile?.full_name || "U").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    const roleName = ROLE_LABELS[profile?.role_id] || profile?.role_id || "";

    const navItems = [];
    if (isAprendiz()) {
        navItems.push({ to: "/dashboard", icon: Home, label: "Inicio" });
        navItems.push({ to: "/dashboard", icon: Calendar, label: "Mis Citas", badge: pendingCount });
    }
    if (isProfessional()) {
        navItems.push({ to: "/professional", icon: ClipboardCheck, label: "Mi Agenda", badge: pendingCount });
    }
    if (isCoordination()) {
        navItems.push({ to: "/coordination", icon: LayoutDashboard, label: "Coordinacion" });
    }
    if (isAdmin()) {
        navItems.push({ to: "/admin", icon: Shield, label: "Panel Admin" });
    }

    return (
        <>
            <div className="topbar">
                <Link to="/" className="topbar-brand">SENA Bienestar</Link>
                <button className="topbar-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
                    {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            <div className={`sidebar-overlay ${mobileOpen ? "open" : ""}`} onClick={() => setMobileOpen(false)} />

            <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">SB</div>
                    <div className="sidebar-brand">
                        <span className="sidebar-brand-name">SENA Bienestar</span>
                        <span className="sidebar-brand-sub">Sistema de Citas</span>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                        <NotificationBell />
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section-label">Principal</div>
                    {navItems.map((item, idx) => (
                        <Link
                            key={idx}
                            to={item.to}
                            className={`sidebar-link ${isActive(item.to) ? "sidebar-link-active" : ""}`}
                        >
                            <span className="sidebar-link-icon"><item.icon size={18} /></span>
                            <span className="sidebar-link-label">{item.label}</span>
                            {item.badge > 0 && <span className="sidebar-badge">{item.badge}</span>}
                        </Link>
                    ))}

                    <div className="sidebar-section-label">Cuenta</div>
                    <Link
                        to="/profile"
                        className={`sidebar-link ${isActive("/profile") ? "sidebar-link-active" : ""}`}
                    >
                        <span className="sidebar-link-icon"><User size={18} /></span>
                        <span className="sidebar-link-label">Mi Perfil</span>
                    </Link>

                    <div className="sidebar-section-label">Manuales</div>
                    <a
                        href="/manual-usuario.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sidebar-link"
                    >
                        <span className="sidebar-link-icon"><BookOpen size={18} /></span>
                        <span className="sidebar-link-label">Manual de Usuario</span>
                    </a>
                    <a
                        href="/manual-tecnico.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sidebar-link"
                    >
                        <span className="sidebar-link-icon"><FileText size={18} /></span>
                        <span className="sidebar-link-label">Manual Tecnico</span>
                    </a>
                </nav>

                <div className="sidebar-footer">
                    <button className="sidebar-link" onClick={toggleTheme} style={{ marginBottom: "var(--space-2)", width: "100%" }}>
                        <span className="sidebar-link-icon">{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</span>
                        <span className="sidebar-link-label">{theme === "dark" ? "Modo Claro" : "Modo Oscuro"}</span>
                    </button>
                    <div className="sidebar-user" onClick={handleLogout} role="button" tabIndex={0}>
                        <div className="sidebar-avatar">{initials}</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{profile?.full_name || "Usuario"}</div>
                            <div className="sidebar-user-role">{roleName}</div>
                        </div>
                        <LogOut size={16} color="var(--gray-400)" />
                    </div>
                </div>
            </aside>
        </>
    );
}
