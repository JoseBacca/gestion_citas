import { useState, useRef, useEffect } from "react";
import { useNotifications } from "../../providers/NotificationContext";
import { Bell, Check, CheckCheck, Trash2, Calendar, AlertCircle, Info, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const typeIcons = { appointment: Calendar, warning: AlertCircle, info: Info, success: Check };
const typeColors = { appointment: "#3b82f6", warning: "#f59e0b", info: "#6b7280", success: "#22c55e" };

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, loading } = useNotifications();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <button onClick={() => setOpen(!open)} style={{ position: "relative", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "transparent", color: "var(--gray-500)", cursor: "pointer", borderRadius: "var(--radius-md)", transition: "all var(--transition-fast)" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--gray-100)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span style={{ position: "absolute", top: 4, right: 4, minWidth: 18, height: 18, borderRadius: "var(--radius-full)", background: "var(--color-error)", color: "white", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", animation: "pulse 2s ease-in-out infinite" }}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 8, width: 380, maxHeight: 480, background: "var(--surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-xl)", border: "1px solid var(--gray-200)", zIndex: 200, overflow: "hidden", animation: "scaleIn 0.15s ease-out" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-4)", borderBottom: "1px solid var(--gray-100)" }}>
                        <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 700, margin: 0 }}>Notificaciones</h3>
                        <div style={{ display: "flex", gap: "var(--space-2)" }}>
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead} style={{ border: "none", background: "none", color: "var(--primary)", fontSize: "var(--text-xs)", fontWeight: 600, cursor: "pointer", padding: "4px 8px", borderRadius: "var(--radius-sm)" }}>
                                    <CheckCheck size={12} /> Marcar todo
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button onClick={clearAll} style={{ border: "none", background: "none", color: "var(--gray-400)", fontSize: "var(--text-xs)", fontWeight: 500, cursor: "pointer", padding: "4px 8px", borderRadius: "var(--radius-sm)" }}>
                                    <Trash2 size={12} /> Limpiar
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ overflowY: "auto", maxHeight: 400 }}>
                        {loading ? (
                            <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--gray-400)" }}>Cargando...</div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding: "var(--space-8)", textAlign: "center" }}>
                                <Bell size={32} color="var(--gray-300)" style={{ margin: "0 auto var(--space-3)" }} />
                                <p style={{ color: "var(--gray-400)", fontSize: "var(--text-sm)" }}>Sin notificaciones</p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const Icon = typeIcons[notif.type] || Info;
                                const color = typeColors[notif.type] || "#6b7280";
                                return (
                                    <div key={notif.id} onClick={() => !notif.read && markAsRead(notif.id)} style={{ display: "flex", gap: "var(--space-3)", padding: "var(--space-3) var(--space-4)", borderBottom: "1px solid var(--gray-50)", cursor: "pointer", background: notif.read ? "transparent" : "var(--primary-light)", transition: "background var(--transition-fast)" }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = notif.read ? "var(--gray-50)" : "var(--primary-light)"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = notif.read ? "transparent" : "var(--primary-light)"}>
                                        <div style={{ width: 32, height: 32, borderRadius: "var(--radius-full)", background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <Icon size={16} color={color} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: "var(--text-sm)", fontWeight: notif.read ? 500 : 700, margin: 0, color: "var(--gray-800)" }}>{notif.title}</p>
                                            <p style={{ fontSize: "var(--text-xs)", color: "var(--gray-500)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{notif.message}</p>
                                            <p style={{ fontSize: "10px", color: "var(--gray-400)", margin: "4px 0 0" }}>{notif.created_at ? format(new Date(notif.created_at), "dd MMM yyyy HH:mm", { locale: es }) : ""}</p>
                                        </div>
                                        {!notif.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0, marginTop: 6 }} />}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
