import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { useDashboard } from "../../dashboard/api/hooks/useDashboard";
import { CalendarCheck, Activity, Users, Download, Save, X, Plus, Trash2, Edit, Building2, Shield, BarChart3, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ROLE_OPTIONS = [
    { value: "APRENDIZ", label: "Aprendiz" }, { value: "COORDINACION", label: "Coordinacion" },
    { value: "PSICOLOGIA", label: "Psicologia" }, { value: "ENFERMERIA", label: "Enfermeria" },
    { value: "TRABAJO_SOCIAL", label: "Trabajo Social" }, { value: "SUPERADMIN", label: "Super Admin" },
];

export default function AdminDashboard() {
    const { kpis, byDependency, professionals, loading, fetchAllMetrics, exportToCSV } = useDashboard();
    const [activeTab, setActiveTab] = useState("overview");
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [dependencies, setDependencies] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [editUserId, setEditUserId] = useState(null);
    const [editRole, setEditRole] = useState("");
    const [editDependency, setEditDependency] = useState("");
    const [newDepName, setNewDepName] = useState("");
    const [newDepColor, setNewDepColor] = useState("#39a900");

    useEffect(() => { fetchAllMetrics(); }, [fetchAllMetrics]);

    const loadTabData = useCallback(async () => {
        if (activeTab === "overview") return;
        if (activeTab === "users") {
            setLoadingUsers(true);
            const { data: usersData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
            const { data: rolesData } = await supabase.from("roles").select("*").order("id");
            const { data: depsData } = await supabase.from("dependencies").select("*").order("name");
            const usersWithDeps = await Promise.all((usersData || []).map(async (u) => {
                if (u.dependency_id) { const { data: dep } = await supabase.from("dependencies").select("*").eq("id", u.dependency_id).single(); return { ...u, dependency: dep }; }
                return { ...u, dependency: null };
            }));
            setUsers(usersWithDeps); setRoles(rolesData || []); setDependencies(depsData || []); setLoadingUsers(false);
        } else if (activeTab === "dependencies") { const { data } = await supabase.from("dependencies").select("*").order("name"); setDependencies(data || []); }
        else if (activeTab === "roles") { const { data } = await supabase.from("roles").select("*").order("id"); setRoles(data || []); }
    }, [activeTab]);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { loadTabData(); }, [loadTabData]);

    const handleEditUser = (user) => { setEditUserId(user.id); setEditRole(user.role_id || ""); setEditDependency(user.dependency_id?.toString() || ""); };
    const handleSaveUser = async () => {
        if (!editUserId) return;
        const updates = { role_id: editRole || null, dependency_id: editDependency ? parseInt(editDependency) : null };
        const { error } = await supabase.from("profiles").update(updates).eq("id", editUserId);
        if (error) { toast.error("Error: " + error.message); return; }
        toast.success("Usuario actualizado");
        setUsers((prev) => prev.map((u) => u.id === editUserId ? { ...u, ...updates, dependency: dependencies.find((d) => d.id === parseInt(editDependency)) || null } : u));
        setEditUserId(null);
    };
    const handleDeleteUser = async (userId) => {
        if (!confirm("Eliminar este usuario?")) return;
        const { error } = await supabase.from("profiles").delete().eq("id", userId);
        if (error) { toast.error("Error eliminando"); return; }
        toast.success("Eliminado"); setUsers((prev) => prev.filter((u) => u.id !== userId));
    };
    const handleAddDependency = async () => {
        if (!newDepName.trim()) { toast.error("Ingresa un nombre"); return; }
        const { data, error } = await supabase.from("dependencies").insert({ name: newDepName.trim(), color: newDepColor }).select().single();
        if (error) { toast.error("Error: " + error.message); return; }
        toast.success("Dependencia creada"); setDependencies((prev) => [...prev, data]); setNewDepName("");
    };
    const handleDeleteDependency = async (id) => {
        if (!confirm("Eliminar esta dependencia?")) return;
        const { error } = await supabase.from("dependencies").delete().eq("id", id);
        if (error) { toast.error("Error"); return; }
        toast.success("Eliminada"); setDependencies((prev) => prev.filter((d) => d.id !== id));
    };

    const kpiList = [
        { label: "Total Citas", value: kpis?.total_appointments ?? 0, icon: CalendarCheck, color: "#3b82f6", bg: "#dbeafe" },
        { label: "Completadas", value: kpis?.completed_appointments ?? 0, icon: Activity, color: "#22c55e", bg: "#d1fae5" },
        { label: "Pendientes", value: kpis?.pending_appointments ?? 0, icon: Clock, color: "#f59e0b", bg: "#fef3c7" },
        { label: "Usuarios", value: kpis?.total_users ?? (users.length || 0), icon: Users, color: "#8b5cf6", bg: "#f3e8ff" },
    ];

    return (
        <div className="admin-panel">
            <div className="page-header">
                <div className="page-header-left"><h1><Shield size={24} color="var(--sena-green)" /> Panel de Administracion</h1><p>Gestion del sistema de bienestar</p></div>
                <div className="page-header-right"><button onClick={exportToCSV} className="btn-primary"><Download size={16} /> Exportar CSV</button></div>
            </div>

            <div className="filter-tabs" style={{ marginBottom: "var(--space-6)" }}>
                {[{ key: "overview", label: "Resumen" }, { key: "users", label: "Usuarios" }, { key: "dependencies", label: "Dependencias" }, { key: "roles", label: "Roles" }].map((tab) => (
                    <button key={tab.key} className={activeTab === tab.key ? "active" : ""} onClick={() => setActiveTab(tab.key)}>{tab.label}</button>
                ))}
            </div>

            {activeTab === "overview" && (loading ? <div style={{ textAlign: "center", padding: "3rem" }}><Loader2 size={32} className="spin" color="var(--sena-green)" /></div> : (
                <>
                    <div className="kpi-grid">
                        {kpiList.map((kpi) => (
                            <div key={kpi.label} className="kpi-card" style={{ "--kpi-color": kpi.color }}>
                                <div className="kpi-card-header"><h3>{kpi.label}</h3><div className="kpi-card-icon" style={{ background: kpi.bg, color: kpi.color }}><kpi.icon size={20} /></div></div>
                                <p className="kpi-value">{kpi.value}</p>
                            </div>
                        ))}
                    </div>
                    <div className="section-card">
                        <h3><BarChart3 size={18} /> Citas por Dependencia</h3>
                        {byDependency.length === 0 ? <p className="text-muted">Sin datos</p> : (
                            <div className="stats-bar-chart">
                                {byDependency.map((dep) => { const maxVal = Math.max(...byDependency.map(d => d.total), 1); const pct = (dep.total / maxVal) * 100; return (
                                    <div key={dep.name} className="stats-bar-row"><span className="stats-bar-label">{dep.name}</span><div className="stats-bar-track"><div className="stats-bar-fill" style={{ width: `${pct}%`, background: dep.color || "var(--sena-green)" }}><span className="stats-bar-value">{dep.total}</span></div></div></div>
                                );})}
                            </div>
                        )}
                    </div>
                    <div className="section-card">
                        <h3><Users size={18} /> Top Profesionales</h3>
                        {professionals.length === 0 ? <p className="text-muted">Sin datos</p> : (
                            <div className="prof-ranking">{professionals.map((prof, idx) => <div key={prof.id} className="prof-rank-item"><span className="prof-rank-pos">#{idx + 1}</span><span className="prof-rank-name">{prof.name}</span><span className="prof-rank-count">{prof.completed} atenciones</span></div>)}</div>
                        )}
                    </div>
                </>
            ))}

            {activeTab === "users" && (
                <div className="admin-table-container">
                    <h3>Usuarios ({users.length})</h3>
                    {loadingUsers ? <div style={{ textAlign: "center", padding: "2rem" }}><Loader2 size={24} className="spin" color="var(--sena-green)" /></div> : (
                        <div style={{ overflowX: "auto" }}>
                            <table className="admin-table">
                                <thead><tr><th>Nombre</th><th>Email</th><th>Doc</th><th>Rol</th><th>Dependencia</th><th>Acciones</th></tr></thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.id}>
                                            <td style={{ fontWeight: 500 }}>{u.full_name || "-"}</td><td>{u.email || "-"}</td><td>{u.document_number || "-"}</td>
                                            <td>{editUserId === u.id ? <select value={editRole} onChange={(e) => setEditRole(e.target.value)} style={{ width: "100%", padding: "0.3rem" }}><option value="">Sin rol</option>{ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select> : <span className={`status-badge status-${u.role_id === "APRENDIZ" ? "pending" : "confirmed"}`}>{ROLE_OPTIONS.find((r) => r.value === u.role_id)?.label || u.role_id || "-"}</span>}</td>
                                            <td>{editUserId === u.id ? <select value={editDependency} onChange={(e) => setEditDependency(e.target.value)} style={{ width: "100%", padding: "0.3rem" }}><option value="">Sin dependencia</option>{dependencies.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select> : (u.dependency?.name || <span style={{ color: "var(--gray-400)" }}>-</span>)}</td>
                                            <td>{editUserId === u.id ? <div style={{ display: "flex", gap: "var(--space-1)" }}><button onClick={handleSaveUser} className="btn-icon"><Save size={14} /></button><button onClick={() => setEditUserId(null)} className="btn-icon"><X size={14} /></button></div> : <div style={{ display: "flex", gap: "var(--space-1)" }}><button onClick={() => handleEditUser(u)} className="btn-icon"><Edit size={14} /></button><button onClick={() => handleDeleteUser(u.id)} className="btn-icon-danger"><Trash2 size={14} /></button></div>}</td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && <tr><td colSpan={6} className="text-center" style={{ padding: "2rem" }}>Sin usuarios</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "dependencies" && (
                <div className="admin-table-container">
                    <h3>Dependencias ({dependencies.length})</h3>
                    <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-5)", alignItems: "flex-end" }}>
                        <div className="field" style={{ flex: 1 }}><label>Nombre</label><input type="text" value={newDepName} onChange={(e) => setNewDepName(e.target.value)} placeholder="Ej: Psicologia" /></div>
                        <div className="field" style={{ width: "100px" }}><label>Color</label><input type="color" value={newDepColor} onChange={(e) => setNewDepColor(e.target.value)} style={{ height: "38px", padding: "2px" }} /></div>
                        <button onClick={handleAddDependency} className="btn-primary" style={{ height: "38px" }}><Plus size={16} /> Crear</button>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <table className="admin-table">
                            <thead><tr><th>ID</th><th>Nombre</th><th>Color</th><th>Acciones</th></tr></thead>
                            <tbody>{dependencies.map((dep) => <tr key={dep.id}><td>{dep.id}</td><td><div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}><span style={{ width: 12, height: 12, borderRadius: "50%", background: dep.color || "var(--sena-green)", display: "inline-block" }} /><span style={{ fontWeight: 500 }}>{dep.name}</span></div></td><td><code style={{ fontSize: "var(--text-xs)", color: "var(--gray-500)" }}>{dep.color}</code></td><td><button onClick={() => handleDeleteDependency(dep.id)} className="btn-icon-danger"><Trash2 size={14} /></button></td></tr>)}
                            {dependencies.length === 0 && <tr><td colSpan={4} className="text-center" style={{ padding: "2rem" }}>Sin dependencias</td></tr>}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === "roles" && (
                <div className="admin-table-container">
                    <h3>Roles ({roles.length})</h3>
                    <div style={{ overflowX: "auto" }}>
                        <table className="admin-table">
                            <thead><tr><th>ID</th><th>Nombre</th><th>Descripcion</th><th>Permisos</th></tr></thead>
                            <tbody>{roles.map((r) => <tr key={r.id}><td>{r.id}</td><td><span className={`status-badge status-${r.name === "APRENDIZ" ? "pending" : "confirmed"}`}>{r.name}</span></td><td>{r.description || "-"}</td><td><div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap" }}>{(Array.isArray(r.permissions) ? r.permissions : []).map((p) => <span key={p} style={{ fontSize: "var(--text-xs)", background: "var(--gray-100)", padding: "2px 8px", borderRadius: "var(--radius-sm)" }}>{p}</span>)}</div></td></tr>)}
                            {roles.length === 0 && <tr><td colSpan={4} className="text-center" style={{ padding: "2rem" }}>Sin roles</td></tr>}</tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
