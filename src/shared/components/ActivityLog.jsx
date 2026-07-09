import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../providers/Authproviders";
import { Activity, Clock, CheckCircle, XCircle, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const actionIcons = { created: Calendar, confirmed: CheckCircle, completed: CheckCircle, cancelled: XCircle, no_show: XCircle };
const actionColors = { created: "#3b82f6", confirmed: "#f59e0b", completed: "#22c55e", cancelled: "#ef4444", no_show: "#8b5cf6" };
const actionLabels = { created: "agendo una cita", confirmed: "confirmo una cita", completed: "completo una atencion", cancelled: "cancelo una cita", no_show: "registro no asistencia" };

export function ActivityLog({ limit = 10 }) {
    const { user, isAdmin, isCoordination } = useAuth();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadActivities(); }, [user]);

    const loadActivities = async () => {
        if (!user) return;
        setLoading(true);

        let query = supabase.from("appointments").select("id, status, created_at, scheduled_date, user_id, professional_id, dependency_id, dependencies(name)").order("created_at", { ascending: false }).limit(limit * 2);

        if (!isAdmin() && !isCoordination()) {
            query = query.or(`user_id.eq.${user.id},professional_id.eq.${user.id}`);
        }

        const { data } = await query;
        if (!data || data.length === 0) { setActivities([]); setLoading(false); return; }

        const userIds = [...new Set(data.flatMap((a) => [a.user_id, a.professional_id].filter(Boolean)))];
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
        const profilesMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.full_name]));

        const activities = data.slice(0, limit).map((apt) => ({
            id: `${apt.id}-${apt.status}`,
            action: apt.status,
            userName: profilesMap[apt.user_id] || "Usuario",
            professionalName: profilesMap[apt.professional_id] || null,
            dependency: apt.dependencies?.name || "Sin dependencia",
            date: apt.created_at,
            scheduledDate: apt.scheduled_date,
        }));

        setActivities(activities);
        setLoading(false);
    };

    if (loading) return <div style={{ textAlign: "center", padding: "var(--space-4)" }}><Loader2 size={20} className="spin" color="var(--sena-green)" /></div>;

    return (
        <div className="section-card">
            <h3><Activity size={18} /> Actividad Reciente</h3>
            {activities.length === 0 ? (
                <p className="text-muted" style={{ textAlign: "center", padding: "var(--space-4)" }}>Sin actividad reciente</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                    {activities.map((act) => {
                        const Icon = actionIcons[act.action] || Activity;
                        const color = actionColors[act.action] || "#6b7280";
                        return (
                            <div key={act.id} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", transition: "background var(--transition-fast)" }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "var(--gray-50)"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                <div style={{ width: 32, height: 32, borderRadius: "var(--radius-full)", background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Icon size={14} color={color} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: "var(--text-sm)", margin: 0 }}>
                                        <strong>{act.userName}</strong> {actionLabels[act.action] || "realizo una accion"}
                                        {act.professionalName && <> con <strong>{act.professionalName}</strong></>}
                                    </p>
                                    <p style={{ fontSize: "var(--text-xs)", color: "var(--gray-400)", margin: "2px 0 0" }}>
                                        {act.dependency} {act.scheduledDate ? `- ${act.scheduledDate}` : ""}
                                    </p>
                                </div>
                                <span style={{ fontSize: "10px", color: "var(--gray-400)", whiteSpace: "nowrap" }}>
                                    {act.date ? format(new Date(act.date), "dd MMM HH:mm", { locale: es }) : ""}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
