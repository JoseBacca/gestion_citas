import { useEffect, useState, useMemo } from "react";
import { useAppointments } from "../components/hooks/UseAppointments";
import { AppointmentForm } from "../components/AppointmentForm";
import { AppointmentCard } from "../components/AppointmentCard";
import { CalendarView } from "../../../shared/components/CalendarView";
import { CalendarCheck, Clock, XCircle, CheckCircle, Loader2, Sparkles, Search, Download, X, FileText, MapPin, User, StickyNote, Calendar } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../../lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function NurseIcon({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v8" /><path d="M8 12h8" /></svg>; }
function PsychIcon({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4a4 4 0 0 1 4 4c0 .9-.3 1.8-.8 2.5" /><path d="M12 4a4 4 0 0 0-4 4c0 .9.3 1.8.8 2.5" /><path d="M9.5 12.5A4 4 0 0 0 12 11a4 4 0 0 0 2.5 1.5" /><path d="M8 16c0-1.1.9-2 2-2h4a2 2 0 0 1 2 2v2c0 1.1-.9 2-2 2h-4a2 2 0 0 1-2-2v-2z" /></svg>; }
function SocialIcon({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="7" r="3" /><circle cx="16" cy="7" r="3" /><path d="M4 17c0-2.2 1.8-4 4-4s4 1.8 4 4" /><path d="M12 17c0-2.2 1.8-4 4-4s4 1.8 4 4" /></svg>; }
function CoordinationIcon({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>; }

const DEP_CONFIG = [
  { match: (name) => /psicolog/i.test(name), icon: PsychIcon, color: "#8b5cf6", bg: "#f5f3ff", description: "Apoyo emocional y bienestar mental" },
  { match: (name) => /enfermer/i.test(name), icon: NurseIcon, color: "#ef4444", bg: "#fef2f2", description: "Atencion en salud y primeros auxilios" },
  { match: (name) => /trabajo.*social/i.test(name), icon: SocialIcon, color: "#f59e0b", bg: "#fffbeb", description: "Orientacion y apoyo psicosocial" },
  { match: (name) => /coordinacion/i.test(name), icon: CoordinationIcon, color: "#10b981", bg: "#ecfdf5", description: "Gestion y coordinacion de servicios" },
];

function getDepConfig(name) { return DEP_CONFIG.find((d) => d.match(name)) || {}; }

const statusLabels = { pending: "Pendiente", confirmed: "Confirmada", completed: "Completada", cancelled: "Cancelada", no_show: "No asistio" };

function SkeletonCard() {
  return (
    <div className="appointment-card" style={{ padding: "var(--space-5)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
        <div className="skeleton skeleton-text" style={{ width: "80px", height: "24px", borderRadius: "var(--radius-full)" }} />
      </div>
      <div className="skeleton skeleton-text" style={{ width: "70%" }} />
      <div className="skeleton skeleton-text" style={{ width: "50%" }} />
      <div className="skeleton skeleton-text-sm" style={{ width: "40%" }} />
    </div>
  );
}

export default function AprendizDashboard() {
  const { appointments, fetchAppointments, cancelAppointment, isLoading } = useAppointments();
  const [showForm, setShowForm] = useState(false);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [dependencies, setDependencies] = useState([]);
  const [selectedDepId, setSelectedDepId] = useState(null);
  const [view, setView] = useState("services");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailAppointment, setDetailAppointment] = useState(null);

  useEffect(() => {
    fetchAppointments();
    supabase.from("dependencies").select("*").then(({ data }) => setDependencies(data || []));
  }, [fetchAppointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesSearch = searchTerm === "" ||
        apt.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.dependencies?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

  const pending = filteredAppointments.filter((a) => a.status === "pending");
  const confirmed = filteredAppointments.filter((a) => a.status === "confirmed");
  const completed = filteredAppointments.filter((a) => a.status === "completed");
  const cancelled = filteredAppointments.filter((a) => a.status === "cancelled");

  const handleCancel = async (id) => { const result = await cancelAppointment(id); if (result.success) toast.success("Cita cancelada correctamente"); setConfirmCancelId(null); };

  const exportToCSV = () => {
    if (appointments.length === 0) { toast.error("No hay citas para exportar"); return; }
    const headers = ["Fecha", "Hora", "Dependencia", "Motivo", "Estado", "Notas"];
    const rows = appointments.map((apt) => [
      apt.scheduled_date ? format(new Date(apt.scheduled_date), "yyyy-MM-dd") : "",
      apt.scheduled_time?.slice(0, 5) || "",
      apt.dependencies?.name || "",
      apt.reason || "",
      statusLabels[apt.status] || apt.status,
      apt.notes || ""
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `citas_${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado correctamente");
  };

  const stats = [
    { label: "Pendientes", value: pending.length, icon: Clock, color: "#f59e0b", bg: "#fef3c7" },
    { label: "Confirmadas", value: confirmed.length, icon: CheckCircle, color: "#3b82f6", bg: "#dbeafe" },
    { label: "Completadas", value: completed.length, icon: CalendarCheck, color: "#22c55e", bg: "#d1fae5" },
    { label: "Canceladas", value: cancelled.length, icon: XCircle, color: "#ef4444", bg: "#fee2e2" },
  ];

  const openFormWithDependency = (depId) => { setSelectedDepId(depId); setShowForm(true); };

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1><Sparkles size={24} color="var(--sena-green)" /> Bienestar Aprendiz</h1>
          <p>Selecciona el servicio que deseas agendar</p>
        </div>
        <div className="page-header-right">
          <div className="filter-tabs">
            <button className={view === "services" ? "active" : ""} onClick={() => setView("services")}>Servicios</button>
            <button className={view === "appointments" ? "active" : ""} onClick={() => setView("appointments")}>Mis Citas</button>
            <button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}>Calendario</button>
          </div>
        </div>
      </div>

      {appointments.length > 0 && (
        <div className="kpi-grid">
          {stats.map((s) => (
            <div key={s.label} className="kpi-card" style={{ "--kpi-color": s.color }}>
              <div className="kpi-card-header"><h3>{s.label}</h3><div className="kpi-card-icon" style={{ background: s.bg, color: s.color }}><s.icon size={20} /></div></div>
              <p className="kpi-value">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {view === "services" && (
        <section className="lobby-section">
          <div className="lobby-grid">
            {dependencies.map((dep) => {
              const cfg = getDepConfig(dep.name);
              const Icon = cfg.icon;
              return (
                <button key={dep.id} className="lobby-card" style={{ "--card-color": cfg.color, "--card-bg": cfg.bg }} onClick={() => openFormWithDependency(dep.id)}>
                  <div className="lobby-card-icon" style={{ background: cfg.bg, color: cfg.color }}>{Icon && <Icon size={32} />}</div>
                  <h3 className="lobby-card-name">{dep.name}</h3>
                  <p className="lobby-card-desc">{cfg.description}</p>
                  <span className="lobby-card-action">Solicitar Cita</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {view === "appointments" && (
        <section className="appointments-list">
          <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-5)", flexWrap: "wrap", alignItems: "center" }}>
            <div className="search-bar">
              <Search size={16} className="search-bar-icon" />
              <input type="text" placeholder="Buscar por motivo, dependencia..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: "0.625rem 0.875rem", border: "1.5px solid var(--gray-200)", borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)", color: "var(--gray-700)", background: "var(--sena-white)", cursor: "pointer" }}>
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="confirmed">Confirmadas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
            <button onClick={exportToCSV} className="btn-secondary btn-sm"><Download size={14} /> Exportar CSV</button>
          </div>

          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="empty-state"><CalendarCheck size={48} /><h3>{searchTerm || statusFilter !== "all" ? "No se encontraron citas" : "No tienes citas agendadas"}</h3><p>{searchTerm || statusFilter !== "all" ? "Intenta con otros filtros" : "Selecciona un servicio para agendar tu primera cita"}</p></div>
          ) : (
            <>
              {pending.length > 0 && <div style={{ marginBottom: "1.5rem" }}><h3 style={{ marginBottom: "0.75rem", fontSize: "0.8rem", color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pendientes ({pending.length})</h3>{pending.map((apt) => <AppointmentCard key={apt.id} appointment={apt} isAprendiz={true} onCancel={() => setConfirmCancelId(apt.id)} onViewDetail={() => setDetailAppointment(apt)} />)}</div>}
              {confirmed.length > 0 && <div style={{ marginBottom: "1.5rem" }}><h3 style={{ marginBottom: "0.75rem", fontSize: "0.8rem", color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Confirmadas ({confirmed.length})</h3>{confirmed.map((apt) => <AppointmentCard key={apt.id} appointment={apt} isAprendiz={true} onViewDetail={() => setDetailAppointment(apt)} />)}</div>}
              {(completed.length > 0 || cancelled.length > 0) && (
                <details className="appointments-history"><summary>Historial ({completed.length + cancelled.length})</summary>
                  <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {completed.map((apt) => <AppointmentCard key={apt.id} appointment={apt} isAprendiz={true} onViewDetail={() => setDetailAppointment(apt)} />)}
                    {cancelled.map((apt) => <AppointmentCard key={apt.id} appointment={apt} isAprendiz={true} onViewDetail={() => setDetailAppointment(apt)} />)}
                  </div>
                </details>
              )}
            </>
          )}
        </section>
      )}

      {view === "calendar" && <CalendarView appointments={appointments} onDayClick={(day) => toast.info(`Citas del ${day.toLocaleDateString("es-CO")}`)} />}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px" }}>
            <h2>Solicitar Nueva Cita</h2>
            <AppointmentForm defaultDependencyId={selectedDepId} onSuccess={() => { setShowForm(false); fetchAppointments(); }} />
          </div>
        </div>
      )}

      {confirmCancelId && (
        <div className="modal-overlay" onClick={() => setConfirmCancelId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "var(--radius-full)", background: "var(--color-error-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-5)" }}><XCircle size={32} color="var(--color-error)" /></div>
            <h2>Cancelar Cita</h2>
            <p style={{ color: "var(--gray-500)", margin: "var(--space-2) 0 var(--space-6)" }}>Estas seguro de cancelar esta cita? No podras recuperarla.</p>
            <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center" }}>
              <button onClick={() => setConfirmCancelId(null)} className="btn-secondary" style={{ flex: 1 }}>Volver</button>
              <button onClick={() => handleCancel(confirmCancelId)} className="btn-danger" style={{ flex: 1 }}>Si, cancelar cita</button>
            </div>
          </div>
        </div>
      )}

      {detailAppointment && (
        <div className="modal-overlay" onClick={() => setDetailAppointment(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-5)" }}>
              <h2 style={{ margin: 0 }}>Detalle de Cita</h2>
              <button onClick={() => setDetailAppointment(null)} className="btn-icon"><X size={18} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)", background: "var(--gray-50)", borderRadius: "var(--radius-md)" }}>
                <span className={`status-badge status-${detailAppointment.status}`} style={{ fontSize: "var(--text-sm)" }}>{statusLabels[detailAppointment.status]}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <Calendar size={18} color="var(--sena-green)" />
                <div><p style={{ fontSize: "var(--text-xs)", color: "var(--gray-400)", margin: 0 }}>Fecha</p><p style={{ fontSize: "var(--text-sm)", fontWeight: 600, margin: 0 }}>{detailAppointment.scheduled_date ? format(new Date(detailAppointment.scheduled_date), "EEEE d 'de' MMMM 'de' yyyy", { locale: es }) : "Sin fecha"}</p></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <Clock size={18} color="var(--sena-green)" />
                <div><p style={{ fontSize: "var(--text-xs)", color: "var(--gray-400)", margin: 0 }}>Hora</p><p style={{ fontSize: "var(--text-sm)", fontWeight: 600, margin: 0 }}>{detailAppointment.scheduled_time?.slice(0, 5) || "--:--"}</p></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <MapPin size={18} color="var(--sena-green)" />
                <div><p style={{ fontSize: "var(--text-xs)", color: "var(--gray-400)", margin: 0 }}>Dependencia</p><p style={{ fontSize: "var(--text-sm)", fontWeight: 600, margin: 0 }}>{detailAppointment.dependencies?.name || "Sin asignar"}</p></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <FileText size={18} color="var(--sena-green)" />
                <div><p style={{ fontSize: "var(--text-xs)", color: "var(--gray-400)", margin: 0 }}>Motivo</p><p style={{ fontSize: "var(--text-sm)", fontWeight: 600, margin: 0 }}>{detailAppointment.reason || "Sin motivo"}</p></div>
              </div>
              {detailAppointment.aprendiz && (
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <User size={18} color="var(--sena-green)" />
                  <div><p style={{ fontSize: "var(--text-xs)", color: "var(--gray-400)", margin: 0 }}>Aprendiz</p><p style={{ fontSize: "var(--text-sm)", fontWeight: 600, margin: 0 }}>{detailAppointment.aprendiz.full_name}</p></div>
                </div>
              )}
              {detailAppointment.notes && (
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <StickyNote size={18} color="var(--sena-green)" />
                  <div><p style={{ fontSize: "var(--text-xs)", color: "var(--gray-400)", margin: 0 }}>Notas</p><p style={{ fontSize: "var(--text-sm)", fontWeight: 600, margin: 0 }}>{detailAppointment.notes}</p></div>
                </div>
              )}
            </div>
            <div style={{ marginTop: "var(--space-6)", display: "flex", gap: "var(--space-3)" }}>
              {detailAppointment.status === "pending" && <button onClick={() => { setDetailAppointment(null); setConfirmCancelId(detailAppointment.id); }} className="btn-danger" style={{ flex: 1 }}>Cancelar Cita</button>}
              <button onClick={() => setDetailAppointment(null)} className="btn-secondary" style={{ flex: 1 }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
