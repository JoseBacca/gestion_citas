import { useEffect, useState, useMemo } from "react";
import { useAppointments } from "../components/hooks/UseAppointments";
import { AppointmentCard } from "../components/AppointmentCard";
import ProfessionalSchedule from "../components/ProfessionalSchedule";
import { useAuth } from "../../../providers/Authproviders";
import { CheckCircle, XCircle, ClipboardCheck, Loader2, Users, Clock, CalendarCheck, Search, Download, StickyNote, Calendar, Settings } from "lucide-react";
import { toast } from "sonner";
import { format, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const statusLabels = { pending: "Pendiente", confirmed: "Confirmada", completed: "Completada", cancelled: "Cancelada", no_show: "No asistio" };

function SkeletonCard() {
  return (
    <div className="appointments-wrapper">
      <div className="appointment-card" style={{ padding: "var(--space-5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
          <div className="skeleton skeleton-text" style={{ width: "80px", height: "24px", borderRadius: "var(--radius-full)" }} />
        </div>
        <div className="skeleton skeleton-text" style={{ width: "70%" }} />
        <div className="skeleton skeleton-text" style={{ width: "50%" }} />
        <div className="skeleton skeleton-text-sm" style={{ width: "40%" }} />
      </div>
    </div>
  );
}

export default function ProfessionalDashboard() {
    const { appointments, fetchAppointments, updateStatus, isLoading } = useAppointments();
    const { profile } = useAuth();
    const [filter, setFilter] = useState("pending");
    const [confirmAction, setConfirmAction] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [notesModal, setNotesModal] = useState(null);
    const [notesText, setNotesText] = useState("");
    const [activeTab, setActiveTab] = useState("appointments");

    useEffect(() => { fetchAppointments({ status: filter }); }, [filter, fetchAppointments]);

    const todayAppointments = useMemo(() => {
        return appointments.filter((apt) => {
            try { return apt.scheduled_date && isToday(parseISO(apt.scheduled_date)); }
            catch { return false; }
        });
    }, [appointments]);

    const filteredAppointments = useMemo(() => {
        return appointments.filter((apt) => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            return (
                apt.aprendiz?.full_name?.toLowerCase().includes(term) ||
                apt.reason?.toLowerCase().includes(term) ||
                apt.scheduled_time?.includes(term)
            );
        });
    }, [appointments, searchTerm]);

    const handleConfirm = (id) => { updateStatus(id, "confirmed"); };
    const handleComplete = (id, notes) => { updateStatus(id, "completed", notes || "Atencion completada"); setConfirmAction(null); setNotesModal(null); setNotesText(""); };
    const handleNoshow = (id) => { updateStatus(id, "no_show"); setConfirmAction(null); };

    const exportToCSV = () => {
        if (appointments.length === 0) { toast.error("No hay citas para exportar"); return; }
        const headers = ["Fecha", "Hora", "Aprendiz", "Motivo", "Estado", "Notas"];
        const rows = appointments.map((apt) => [
            apt.scheduled_date ? format(new Date(apt.scheduled_date), "yyyy-MM-dd") : "",
            apt.scheduled_time?.slice(0, 5) || "",
            apt.aprendiz?.full_name || "",
            apt.reason || "",
            statusLabels[apt.status] || apt.status,
            apt.notes || ""
        ]);
        const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `citas_${profile?.dependency?.name || "profesional"}_${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
        URL.revokeObjectURL(url);
        toast.success("CSV exportado correctamente");
    };

    const depName = profile?.dependency?.name || "Citas";

    return (
        <div className="dashboard-container">
            <div className="page-header">
                <div className="page-header-left">
                    <h1><ClipboardCheck size={24} color="var(--primary)" /> {depName}</h1>
                    <p>{format(new Date(), "EEEE d 'de' MMMM", { locale: es })}</p>
                </div>
                <div className="page-header-right">
                    <button onClick={exportToCSV} className="btn-secondary btn-sm"><Download size={14} /> Exportar</button>
                </div>
            </div>

            {todayAppointments.length > 0 && (
                <div className="section-card" style={{ borderLeft: "4px solid var(--primary)", marginBottom: "var(--space-6)" }}>
                    <h3><Calendar size={18} color="var(--primary)" /> Citas de Hoy ({todayAppointments.length})</h3>
                    <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
                        {todayAppointments.map((apt) => (
                            <div key={apt.id} style={{ flex: "1 1 280px", padding: "var(--space-3)", background: "var(--gray-50)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                                <div style={{ width: 48, height: 48, borderRadius: "var(--radius-full)", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Clock size={20} color="var(--primary)" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: 600, fontSize: "var(--text-sm)", margin: 0 }}>{apt.scheduled_time?.slice(0, 5)}</p>
                                    <p style={{ fontSize: "var(--text-xs)", color: "var(--gray-500)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{apt.aprendiz?.full_name || "Sin nombre"}</p>
                                </div>
                                <span className={`status-badge status-${apt.status}`} style={{ fontSize: "10px" }}>{statusLabels[apt.status]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="filter-tabs" style={{ marginBottom: "var(--space-6)" }}>
                <button className={activeTab === "appointments" ? "active" : ""} onClick={() => setActiveTab("appointments")}><ClipboardCheck size={14} /> Citas</button>
                <button className={activeTab === "schedule" ? "active" : ""} onClick={() => setActiveTab("schedule")}><Settings size={14} /> Mi Horario</button>
            </div>

            {activeTab === "appointments" && (
                <>
                    <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-5)", flexWrap: "wrap", alignItems: "center" }}>
                        <div className="search-bar">
                            <Search size={16} className="search-bar-icon" />
                            <input type="text" placeholder="Buscar por aprendiz, motivo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="filter-tabs">
                            <button className={filter === "pending" ? "active" : ""} onClick={() => setFilter("pending")}>Pendientes</button>
                            <button className={filter === "confirmed" ? "active" : ""} onClick={() => setFilter("confirmed")}>Confirmadas</button>
                            <button className={filter === "completed" ? "active" : ""} onClick={() => setFilter("completed")}>Historial</button>
                        </div>
                    </div>

                    {confirmAction && (
                        <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px", textAlign: "center" }}>
                                <div style={{ width: 64, height: 64, borderRadius: "var(--radius-full)", background: confirmAction.type === "complete" ? "var(--color-success-light)" : "var(--color-warning-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-5)" }}>
                                    {confirmAction.type === "complete" ? <CheckCircle size={32} color="var(--color-success)" /> : <XCircle size={32} color="var(--color-warning)" />}
                                </div>
                                <h2>{confirmAction.type === "complete" ? "Completar Atencion" : "Registrar No Asistencia"}</h2>
                                <p style={{ color: "var(--gray-500)", margin: "var(--space-2) 0 var(--space-6)" }}>{confirmAction.type === "complete" ? "Marcar esta cita como completada?" : "Confirmar que el aprendiz no asistio?"}</p>
                                <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center" }}>
                                    <button onClick={() => setConfirmAction(null)} className="btn-secondary" style={{ flex: 1 }}>Volver</button>
                                    <button onClick={() => { if (confirmAction.type === "complete") { setNotesModal(confirmAction.id); setConfirmAction(null); } else handleNoshow(confirmAction.id); }} className={confirmAction.type === "complete" ? "btn-success" : "btn-warning"} style={{ flex: 1 }}>{confirmAction.type === "complete" ? "Si, completar" : "Si, no asistio"}</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {notesModal && (
                        <div className="modal-overlay" onClick={() => { setNotesModal(null); setNotesText(""); }}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
                                <h2>Notas de la Atencion</h2>
                                <p style={{ color: "var(--gray-500)", fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>Opcional: agrega notas sobre la atencion realizada</p>
                                <div className="field">
                                    <textarea placeholder="Escribe las notas de la atencion..." value={notesText} onChange={(e) => setNotesText(e.target.value)} rows={4} style={{ resize: "vertical" }} />
                                </div>
                                <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-5)" }}>
                                    <button onClick={() => { setNotesModal(null); setNotesText(""); }} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                                    <button onClick={() => handleComplete(notesModal, notesText)} className="btn-success" style={{ flex: 1 }}><CheckCircle size={16} /> Completar</button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="appointments-grid">
                        {isLoading ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                                <SkeletonCard /><SkeletonCard /><SkeletonCard />
                            </div>
                        ) : filteredAppointments.length === 0 ? (
                            <div className="empty-state"><Users size={48} /><h3>{searchTerm ? "No se encontraron citas" : filter === "pending" ? "No hay citas pendientes" : filter === "confirmed" ? "No hay citas confirmadas" : "No hay historial"}</h3><p>{searchTerm ? "Intenta con otro termino de busqueda" : ""}</p></div>
                        ) : (
                            filteredAppointments.map((apt) => (
                                <div key={apt.id} className="appointments-wrapper">
                                    <AppointmentCard appointment={apt} isAprendiz={false} />
                                    {filter === "pending" && <div className="professional-actions"><button onClick={() => handleConfirm(apt.id)} className="btn-success"><CheckCircle size={16} /> Confirmar</button><button onClick={() => setConfirmAction({ id: apt.id, type: "noshow" })} className="btn-secondary"><XCircle size={16} /> No asistio</button></div>}
                                    {filter === "confirmed" && <div className="professional-actions"><button onClick={() => setConfirmAction({ id: apt.id, type: "complete" })} className="btn-primary"><CheckCircle size={16} /> Completar Atencion</button></div>}
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {activeTab === "schedule" && <ProfessionalSchedule />}
        </div>
    );
}
