import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAppointments } from "./hooks/UseAppointments";
import { CalendarDays, Clock, Loader2, ArrowRight, Check, X } from "lucide-react";
import { TimeSlotPicker } from "./TimeSlotPicker";
import { toast } from "sonner";

export function RescheduleModal({ appointment, onClose, onSuccess }) {
    const { updateStatus } = useAppointments();
    const [newDate, setNewDate] = useState("");
    const [newTime, setNewTime] = useState("");
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1);

    if (!appointment) return null;

    const handleReschedule = async () => {
        if (!newDate || !newTime) { toast.error("Selecciona fecha y hora"); return; }

        setSaving(true);
        try {
            const { data: existing } = await supabase
                .from("appointments")
                .select("id")
                .eq("dependency_id", appointment.dependency_id)
                .eq("scheduled_date", newDate)
                .eq("scheduled_time", newTime)
                .not("status", "eq", "cancelled")
                .not("id", "eq", appointment.id);

            if (existing && existing.length > 0) {
                toast.error("Este horario ya esta ocupado. Selecciona otro.");
                setSaving(false);
                return;
            }

            const { error } = await supabase
                .from("appointments")
                .update({ scheduled_date: newDate, scheduled_time: newTime })
                .eq("id", appointment.id);

            if (error) throw error;

            toast.success("Cita reagendada correctamente");
            onSuccess?.();
            onClose();
        } catch (err) {
            toast.error("Error reagendando: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-5)" }}>
                    <h2 style={{ margin: 0 }}>Reagendar Cita</h2>
                    <button onClick={onClose} className="btn-icon"><X size={18} /></button>
                </div>

                <div style={{ background: "var(--gray-50)", borderRadius: "var(--radius-md)", padding: "var(--space-4)", marginBottom: "var(--space-5)" }}>
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--gray-400)", margin: "0 0 4px" }}>Cita actual</p>
                    <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, margin: 0 }}>{appointment.scheduled_date} a las {appointment.scheduled_time?.slice(0, 5)}</p>
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--gray-500)", margin: "4px 0 0" }}>{appointment.dependencies?.name} - {appointment.reason || "Sin motivo"}</p>
                </div>

                {step === 1 && (
                    <div className="animate-fade-in">
                        <div className="field">
                            <label><CalendarDays size={14} /> Nueva fecha</label>
                            <input type="date" value={newDate} onChange={(e) => { setNewDate(e.target.value); setNewTime(""); }} min={new Date().toISOString().split("T")[0]} />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-fade-in">
                        <div className="field">
                            <label><Clock size={14} /> Nueva hora</label>
                            {newDate ? (
                                <TimeSlotPicker dependencyId={appointment.dependency_id} date={newDate} value={newTime} onChange={setNewTime} />
                            ) : (
                                <p className="text-muted">Selecciona una fecha primero</p>
                            )}
                        </div>
                    </div>
                )}

                <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-5)" }}>
                    {step === 2 && <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1 }}>Atras</button>}
                    {step === 1 ? (
                        <button onClick={() => { if (newDate) setStep(2); else toast.error("Selecciona una fecha"); }} className="btn-primary" style={{ flex: 1 }}>Siguiente <ArrowRight size={16} /></button>
                    ) : (
                        <button onClick={handleReschedule} disabled={saving || !newDate || !newTime} className="btn-primary" style={{ flex: 1 }}>
                            {saving ? <Loader2 size={16} className="spin" /> : <><Check size={16} /> Confirmar Reagendamiento</>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
