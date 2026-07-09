import { useState, useMemo } from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isToday, isSameDay, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function CalendarView({ appointments = [], onDayClick }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const days = useMemo(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }, [currentDate]);

    const getAppointmentsForDay = (day) => appointments.filter((apt) => apt.scheduled_date && isSameDay(new Date(apt.scheduled_date), day));

    const dayLabels = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <h3 style={{ textTransform: "capitalize" }}>{format(currentDate, "MMMM yyyy", { locale: es })}</h3>
                <div className="calendar-nav">
                    <button className="btn-icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft size={18} /></button>
                    <button className="btn-secondary btn-sm" onClick={() => setCurrentDate(new Date())}>Hoy</button>
                    <button className="btn-icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight size={18} /></button>
                </div>
            </div>
            <div className="calendar-grid">
                {dayLabels.map((label) => <div key={label} className="calendar-day-header">{label}</div>)}
                {days.map((day) => {
                    const dayAppts = getAppointmentsForDay(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isTodayDate = isToday(day);
                    return (
                        <div key={day.toISOString()} className={`calendar-day ${!isCurrentMonth ? "other-month" : ""} ${isTodayDate ? "today" : ""}`} onClick={() => onDayClick?.(day)}>
                            <div className="calendar-day-number">{format(day, "d")}</div>
                            {dayAppts.slice(0, 2).map((apt) => (
                                <div key={apt.id} className={`calendar-event ${apt.status}`} title={`${apt.reason || "Cita"} - ${apt.scheduled_time?.slice(0, 5)}`}>
                                    {apt.scheduled_time?.slice(0, 5)} {apt.reason?.slice(0, 10)}
                                </div>
                            ))}
                            {dayAppts.length > 2 && <div style={{ fontSize: "9px", color: "var(--gray-500)", textAlign: "center", fontWeight: 600 }}>+{dayAppts.length - 2} mas</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
