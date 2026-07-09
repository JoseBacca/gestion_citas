import { useState, useEffect } from "react";
import { AppointmentRepository } from "../api/appointments.repository";
import { Loader2, Clock } from "lucide-react";

const TIME_SLOTS = Array.from({ length: 9 }, (_, i) => `${(8 + i).toString().padStart(2, "0")}:00`);

export function TimeSlotPicker({ dependencyId, date, value, onChange }) {
  const [unavailableSlots, setUnavailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!dependencyId || !date) return;
    const checkAvailability = async () => {
      setLoading(true);
      const results = await Promise.all(TIME_SLOTS.map(async (time) => {
        const available = await AppointmentRepository.checkAvailability(dependencyId, date, time);
        return { time, available };
      }));
      setUnavailableSlots(results.filter((r) => !r.available).map((r) => r.time));
      setLoading(false);
    };
    checkAvailability();
  }, [dependencyId, date]);

  const availableCount = TIME_SLOTS.filter((t) => !unavailableSlots.includes(t)).length;

  return (
    <div className="time-slots">
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
        <Clock size={14} color="var(--gray-500)" />
        <span style={{ fontSize: "var(--text-sm)", color: "var(--gray-500)" }}>{loading ? "Verificando..." : `${availableCount} horarios disponibles`}</span>
      </div>
      {loading && <div style={{ textAlign: "center", padding: "var(--space-4)" }}><Loader2 size={20} className="spin" color="var(--primary)" /></div>}
      <div className="time-slot-grid">
        {TIME_SLOTS.map((time) => {
          const isUnavailable = unavailableSlots.includes(time);
          const isSelected = value === time;
          return (
            <button key={time} type="button" className={`time-slot ${isSelected ? "selected" : ""} ${isUnavailable ? "unavailable" : ""}`} disabled={isUnavailable} onClick={() => onChange(time)}>{time}</button>
          );
        })}
      </div>
    </div>
  );
}
