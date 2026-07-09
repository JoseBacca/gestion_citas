import { useState, useCallback } from "react";
import { AppointmentRepository } from "../../api/appointments.repository";
import { toast } from "sonner";
import { useAuth } from "../../../../providers/Authproviders";

const STATUS = {
    IDLE: "idle",
    CREATING: "creating",
    FETCHING: "fetching",
    UPDATING: "updating",
};

export function useAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [status, setStatus] = useState(STATUS.IDLE);
    const [error, setError] = useState(null);
    const { user, profile, isAprendiz } = useAuth();

    const fetchAppointments = useCallback(
        async (filters = {}) => {
            setStatus(STATUS.FETCHING);
            setError(null);

            try {
                if (!user) throw new Error("Usuario no autenticado");

                const roleFilters = isAprendiz()
                    ? { userId: user.id }
                    : { dependencyId: profile?.dependency_id || profile?.dependency?.id };

                if (!roleFilters.dependencyId && !isAprendiz()) {
                    throw new Error("Perfil sin dependencia asignada");
                }

                const data = await AppointmentRepository.fetch({
                    ...roleFilters,
                    ...filters,
                });
                setAppointments(data);
                return data;
            } catch (err) {
                setError(err.message);
                console.error("Error cargando citas:", err.message);
                toast.error(`Error cargando citas: ${err.message}`);
                return [];
            } finally {
                setStatus(STATUS.IDLE);
            }
        },
        [user, profile, isAprendiz],
    );

    const createAppointment = async (formData) => {
        setStatus(STATUS.CREATING);

        try {
            if (isAprendiz()) {
                const pendingCount = await AppointmentRepository.countPending(user.id);
                if (pendingCount >= 2) {
                    throw new Error("Ya tienes 2 citas pendientes. Espera a que se atienda una.");
                }
            }

            const isAvailable = await AppointmentRepository.checkAvailability(
                formData.dependency_id,
                formData.scheduled_date,
                formData.scheduled_time,
            );

            if (!isAvailable) {
                throw new Error("Este horario ya esta ocupado. Selecciona otro.");
            }

            const newAppointment = await AppointmentRepository.create({
                ...formData,
                user_id: user.id,
                status: "pending",
            });

            setAppointments((prev) => [...prev, newAppointment]);
            toast.success("Cita agendada correctamente");
            return { success: true, data: newAppointment };
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
            return { success: false, error: err.message };
        } finally {
            setStatus(STATUS.IDLE);
        }
    };

    const updateStatus = async (appointmentId, newStatus, notes = null) => {
        setStatus(STATUS.UPDATING);

        try {
            const updates = { status: newStatus };
            if (notes) updates.notes = notes;

            const updated = await AppointmentRepository.update(appointmentId, updates);

            setAppointments((prev) =>
                prev.map((app) => (app.id === appointmentId ? updated : app))
            );

            toast.success(
                `Cita ${newStatus === "confirmed" ? "confirmada" : "actualizada"}`,
            );
            return { success: true };
        } catch (err) {
            toast.error("Error actualizando cita");
            return { success: false, error: err.message };
        } finally {
            setStatus(STATUS.IDLE);
        }
    };

    const cancelAppointment = async (appointmentId) => {
        const appointment = appointments.find((a) => a.id === appointmentId);

        if (appointment?.status !== "pending") {
            toast.error("Solo puedes cancelar citas pendientes");
            return { success: false };
        }

        return updateStatus(appointmentId, "cancelled");
    };

    return {
        appointments,
        status,
        error,
        isLoading: status === STATUS.FETCHING,
        isCreating: status === STATUS.CREATING,
        fetchAppointments,
        createAppointment,
        updateStatus,
        cancelAppointment,
    };
}