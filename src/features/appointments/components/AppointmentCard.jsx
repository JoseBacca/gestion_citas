import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, MapPin, FileText, User, StickyNote, Eye, RefreshCw, Hash } from "lucide-react";

const statusLabels = { pending: "Pendiente", confirmed: "Confirmada", completed: "Completada", cancelled: "Cancelada", no_show: "No asistio" };
const statusIcons = { pending: "⏳", confirmed: "✅", completed: "✔️", cancelled: "❌", no_show: "🚫" };

export function AppointmentCard({ appointment, isAprendiz, onCancel, onViewDetail, onReschedule }) {
  const formattedDate = appointment.scheduled_date ? format(new Date(appointment.scheduled_date), "EEEE d 'de' MMMM", { locale: es }) : "Sin fecha";
  const formattedTime = appointment.scheduled_time ? appointment.scheduled_time.slice(0, 5) : "--:--";

  return (
    <div className="appointment-card">
      <div className="appointment-header">
        <span className={`status-badge status-${appointment.status}`}>{statusIcons[appointment.status]} {statusLabels[appointment.status] || appointment.status}</span>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          {onViewDetail && (
            <button onClick={onViewDetail} className="btn-icon tooltip" data-tip="Ver detalle">
              <Eye size={16} />
            </button>
          )}
          {onReschedule && (appointment.status === "pending" || appointment.status === "confirmed") && (
            <button onClick={() => onReschedule(appointment)} className="btn-icon tooltip" data-tip="Reagendar" style={{ color: "var(--color-info)", borderColor: "var(--color-info-light)" }}>
              <RefreshCw size={16} />
            </button>
          )}
          {isAprendiz && appointment.status === "pending" && onCancel && (
            <button onClick={onCancel} className="btn-danger btn-sm">Cancelar</button>
          )}
        </div>
      </div>
      <div className="appointment-body">
        <p><Calendar size={14} /><strong>Fecha:</strong> {formattedDate}</p>
        <p><Clock size={14} /><strong>Hora:</strong> {formattedTime}</p>
        <p><MapPin size={14} /><strong>Dependencia:</strong> {appointment.dependencies?.name || "Sin asignar"}</p>
        <p><FileText size={14} /><strong>Motivo:</strong> {appointment.reason || "Sin motivo"}</p>
        {!isAprendiz && appointment.aprendiz && <p><User size={14} /><strong>Aprendiz:</strong> {appointment.aprendiz.full_name}</p>}
        {!isAprendiz && appointment.aprendiz?.ficha && <p><Hash size={14} /><strong>Ficha:</strong> <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{appointment.aprendiz.ficha}</span></p>}
        {appointment.notes && <p><StickyNote size={14} /><strong>Notas:</strong> {appointment.notes}</p>}
      </div>
    </div>
  );
}
