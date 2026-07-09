import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../providers/Authproviders";
import { Clock, Save, Loader2, Plus, Trash2, Calendar, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const DAY_LABELS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
const DAY_SHORT = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
const TIME_OPTIONS = [];
for (let h = 7; h <= 18; h++) { TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`); if (h < 18) TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`); }

export default function ProfessionalSchedule() {
    const { user } = useAuth();
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { loadSchedule(); }, [user]);
    const loadSchedule = async () => {
        if (!user) return;
        setLoading(true);
        const { data } = await supabase.from("professional_schedules").select("*").eq("professional_id", user.id).order("day_of_week");
        if (data && data.length > 0) {
            setSchedule(data.map((s) => ({ day_of_week: s.day_of_week, start_time: s.start_time, end_time: s.end_time, active: s.active })));
        } else {
            setSchedule(DAY_LABELS.map((_, i) => ({ day_of_week: i, start_time: "08:00", end_time: "12:00", active: i < 5 })));
        }
        setLoading(false);
    };

    const updateSchedule = (dayIndex, field, value) => {
        setSchedule((prev) => prev.map((s) => s.day_of_week === dayIndex ? { ...s, [field]: value } : s));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await supabase.from("professional_schedules").delete().eq("professional_id", user.id);
            const inserts = schedule.filter((s) => s.active).map((s) => ({
                professional_id: user.id,
                day_of_week: s.day_of_week,
                start_time: s.start_time,
                end_time: s.end_time,
                active: s.active,
            }));
            if (inserts.length > 0) {
                const { error } = await supabase.from("professional_schedules").insert(inserts);
                if (error) throw error;
            }
            toast.success("Horario guardado correctamente");
        } catch (err) {
            toast.error("Error guardando horario: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ textAlign: "center", padding: "2rem" }}><Loader2 size={24} className="spin" color="var(--primary)" /></div>;

    return (
        <div className="section-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-5)" }}>
                <h3 style={{ margin: 0 }}><Clock size={18} /> Mi Horario de Atencion</h3>
                <button onClick={handleSave} disabled={saving} className="btn-primary btn-sm">
                    {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Guardar
                </button>
            </div>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--gray-500)", marginBottom: "var(--space-4)" }}>
                Configura tus dias y horarios de disponibilidad para atenciones.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {DAY_LABELS.map((day, idx) => {
                    const daySchedule = schedule.find((s) => s.day_of_week === idx) || { day_of_week: idx, start_time: "08:00", end_time: "12:00", active: false };
                    return (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)", background: daySchedule.active ? "var(--primary-light)" : "var(--gray-50)", borderRadius: "var(--radius-md)", transition: "all var(--transition-fast)", border: `1px solid ${daySchedule.active ? "var(--primary)" : "var(--gray-200)"}` }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", minWidth: 120, cursor: "pointer" }}>
                                <input type="checkbox" checked={daySchedule.active} onChange={(e) => updateSchedule(idx, "active", e.target.checked)} style={{ width: 18, height: 18, accentColor: "var(--primary)" }} />
                                <span style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: daySchedule.active ? "var(--primary-dark)" : "var(--gray-500)" }}>{DAY_SHORT[idx]}</span>
                            </label>
                            {daySchedule.active ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flex: 1 }}>
                                    <select value={daySchedule.start_time} onChange={(e) => updateSchedule(idx, "start_time", e.target.value)} style={{ padding: "0.4rem 0.6rem", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-sm)", fontSize: "var(--text-sm)", fontFamily: "var(--font-mono)", fontWeight: 500, background: "var(--surface)" }}>
                                        {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <span style={{ color: "var(--gray-400)", fontWeight: 600 }}>a</span>
                                    <select value={daySchedule.end_time} onChange={(e) => updateSchedule(idx, "end_time", e.target.value)} style={{ padding: "0.4rem 0.6rem", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-sm)", fontSize: "var(--text-sm)", fontFamily: "var(--font-mono)", fontWeight: 500, background: "var(--surface)" }}>
                                        {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <CheckCircle size={14} color="var(--primary)" style={{ marginLeft: "auto" }} />
                                </div>
                            ) : (
                                <span style={{ fontSize: "var(--text-sm)", color: "var(--gray-400)", fontStyle: "italic" }}>No disponible</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
