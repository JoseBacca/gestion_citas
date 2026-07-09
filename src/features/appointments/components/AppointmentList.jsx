import { AppointmentCard } from "./AppointmentCard";

export function AppointmentList({ appointments, isLoading, isAprendiz, onCancel, emptyMessage = "No hay citas" }) {
  if (isLoading) {
    return <p className="text-center">Cargando citas...</p>;
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="empty-state">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="appointments-list">
      {appointments.map((apt) => (
        <AppointmentCard
          key={apt.id}
          appointment={apt}
          isAprendiz={isAprendiz}
          onCancel={onCancel ? () => onCancel(apt.id) : undefined}
        />
      ))}
    </div>
  );
}
