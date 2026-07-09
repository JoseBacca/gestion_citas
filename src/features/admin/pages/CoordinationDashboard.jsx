import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../../../lib/supabase";
import { useDashboard } from "../../dashboard/api/hooks/useDashboard";
import { ActivityLog } from "../../../shared/components/ActivityLog";
import { CalendarCheck, Building2, Activity, Download, Loader2, Clock, BarChart3, Search, XCircle } from "lucide-react";
import { toast } from "sonner";

function SkeletonTable() {
  return (
    <div style={{ padding: "var(--space-4)" }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-3)", alignItems: "center" }}>
          <div className="skeleton skeleton-text" style={{ width: "80px" }} />
          <div className="skeleton skeleton-text" style={{ width: "50px" }} />
          <div className="skeleton skeleton-text" style={{ width: "120px" }} />
          <div className="skeleton skeleton-text" style={{ width: "100px" }} />
          <div className="skeleton skeleton-text" style={{ width: "80px" }} />
        </div>
      ))}
    </div>
  );
}

export default function CoordinationDashboard() {
    const { kpis, byDependency, loading, fetchAllMetrics, exportToCSV } = useDashboard();
    const [appointments, setAppointments] = useState([]);
    const [loadingAppts, setLoadingAppts] = useState(false);
    const [filter, setFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [cancelConfirmId, setCancelConfirmId] = useState(null);

    useEffect(() => { fetchAllMetrics(); }, [fetchAllMetrics]);

    const loadAppointments = useCallback(async () => {
        setLoadingAppts(true);
        let query = supabase.from("appointments").select("*, dependencies(name)").order("scheduled_date", { ascending: false }).limit(50);
        if (filter !== "all") query = query.eq("status", filter);
        const { data } = await query;
        if (data && data.length > 0) {
            const userIds = [...new Set(data.flatMap((a) => [a.user_id, a.professional_id].filter(Boolean)))];
            const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
            const profilesMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.full_name]));
            setAppointments(data.map((a) => ({ ...a, aprendiz_name: profilesMap[a.user_id] || "-", professional_name: profilesMap[a.professional_id] || "Sin asignar" })));
        } else { setAppointments(data || []); }
        setLoadingAppts(false);
    }, [filter]);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { loadAppointments(); }, [loadAppointments]);

    const filteredAppointments = useMemo(() => {
        if (!searchTerm) return appointments;
        const term = searchTerm.toLowerCase();
        return appointments.filter((apt) =>
            apt.aprendiz_name?.toLowerCase().includes(term) ||
            apt.professional_name?.toLowerCase().includes(term) ||
            apt.dependencies?.name?.toLowerCase().includes(term) ||
            apt.scheduled_date?.includes(term)
        );
    }, [appointments, searchTerm]);

    const handleCancelByCoord = async (id) => {
        const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
        if (error) { toast.error("Error cancelando cita"); return; }
        toast.success("Cita cancelada"); setAppointments((prev) => prev.filter((a) => a.id !== id)); setCancelConfirmId(null);
    };

    const STATUS_LABELS = { pending: "Pendiente", confirmed: "Confirmada", completed: "Completada", cancelled: "Cancelada", no_show: "No asistio" };
    const kpiList = [
        { label: "Total Citas", value: kpis?.total_appointments ?? 0, icon: CalendarCheck, color: "#3b82f6", bg: "#dbeafe" },
        { label: "Completadas", value: kpis?.completed_appointments ?? 0, icon: Activity, color: "#22c55e", bg: "#d1fae5" },
        { label: "Pendientes", value: kpis?.pending_appointments ?? 0, icon: Clock, color: "#f59e0b", bg: "#fef3c7" },
        { label: "Dependencias", value: byDependency.length || 0, icon: Building2, color: "#39a900", bg: "#e8f5e0" },
    ];

    return (
        <div className="admin-panel">
            <div className="page-header">
                <div className="page-header-left"><h1><Building2 size={24} color="var(--primary)" /> Panel de Coordinacion</h1><p>Vista general del sistema de citas</p></div>
                <div className="page-header-right"><button onClick={exportToCSV} className="btn-primary"><Download size={16} /> Exportar CSV</button></div>
            </div>

            {loading ? (
                <div className="kpi-grid">
                    {[1,2,3,4].map(i => <div key={i} className="kpi-card"><div className="skeleton skeleton-card" style={{ height: "80px" }} /></div>)}
                </div>
            ) : (
                <div className="kpi-grid">{kpiList.map((kpi) => <div key={kpi.label} className="kpi-card" style={{ "--kpi-color": kpi.color }}><div className="kpi-card-header"><h3>{kpi.label}</h3><div className="kpi-card-icon" style={{ background: kpi.bg, color: kpi.color }}><kpi.icon size={20} /></div></div><p className="kpi-value">{kpi.value}</p></div>)}</div>
            )}

            <div className="section-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-5)", flexWrap: "wrap", gap: "var(--space-3)" }}>
                    <h3 style={{ margin: 0 }}>Citas Recientes</h3>
                    <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
                        <div className="search-bar" style={{ maxWidth: "240px" }}>
                            <Search size={16} className="search-bar-icon" />
                            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="filter-tabs">
                            {[{ key: "all", label: "Todas" }, { key: "pending", label: "Pendientes" }, { key: "confirmed", label: "Confirmadas" }, { key: "completed", label: "Completadas" }, { key: "cancelled", label: "Canceladas" }].map((s) => (
                                <button key={s.key} className={filter === s.key ? "active" : ""} onClick={() => setFilter(s.key)}>{s.label}</button>
                            ))}
                        </div>
                    </div>
                </div>
                {loadingAppts ? <SkeletonTable /> : (
                    <div style={{ overflowX: "auto" }}>
                        <table className="admin-table">
                            <thead><tr><th>Fecha</th><th>Hora</th><th>Aprendiz</th><th>Profesional</th><th>Dependencia</th><th>Estado</th><th>Accion</th></tr></thead>
                            <tbody>
                                {filteredAppointments.map((apt) => (
                                    <tr key={apt.id}><td>{apt.scheduled_date}</td><td style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{apt.scheduled_time?.slice(0, 5)}</td><td style={{ fontWeight: 500 }}>{apt.aprendiz_name}</td><td>{apt.professional_name}</td><td>{apt.dependencies?.name || "-"}</td>
                                    <td><span className={`status-badge status-${apt.status}`}>{STATUS_LABELS[apt.status] || apt.status}</span></td>
                                    <td>{apt.status !== "cancelled" && apt.status !== "completed" && <button onClick={() => setCancelConfirmId(apt.id)} className="btn-danger btn-sm">Cancelar</button>}</td></tr>
                                ))}
                                {filteredAppointments.length === 0 && <tr><td colSpan={7} className="text-center" style={{ padding: "2rem" }}>{searchTerm ? "No se encontraron resultados" : "Sin citas"}</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {cancelConfirmId && (
                <div className="modal-overlay" onClick={() => setCancelConfirmId(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px", textAlign: "center" }}>
                        <div style={{ width: 64, height: 64, borderRadius: "var(--radius-full)", background: "var(--color-error-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-5)" }}><XCircle size={32} color="var(--color-error)" /></div>
                        <h2>Cancelar Cita</h2>
                        <p style={{ color: "var(--gray-500)", margin: "var(--space-2) 0 var(--space-6)" }}>Estas seguro de cancelar esta cita desde Coordinacion?</p>
                        <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center" }}>
                            <button onClick={() => setCancelConfirmId(null)} className="btn-secondary" style={{ flex: 1 }}>Volver</button>
                            <button onClick={() => handleCancelByCoord(cancelConfirmId)} className="btn-danger" style={{ flex: 1 }}>Si, cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="section-card">
                <h3><BarChart3 size={18} /> Rendimiento por Dependencia</h3>
                {byDependency.length === 0 ? <p className="text-muted">Sin datos</p> : (
                    <div className="stats-bar-chart">
                        {byDependency.map((dep) => { const maxVal = Math.max(...byDependency.map(d => d.total), 1); const pct = (dep.total / maxVal) * 100; return (
                            <div key={dep.name} className="stats-bar-row"><span className="stats-bar-label">{dep.name}</span><div className="stats-bar-track"><div className="stats-bar-fill" style={{ width: `${pct}%`, background: dep.color || "var(--primary)" }}><span className="stats-bar-value">{dep.total}</span></div></div></div>
                        );})}
                    </div>
                )}
            </div>

            <ActivityLog limit={8} />
        </div>
    );
}
