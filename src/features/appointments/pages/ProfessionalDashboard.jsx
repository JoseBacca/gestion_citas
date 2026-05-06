import { useEffect, useState } from "react";
import {useAppointments} from "../hooks/useAppointments";
import { AppointmentCard } from "../components/AppointmentCard";
import { useAuth } from  "../../../providers/Authproviders";

export default function ProfessionalDashboard(){
    const{ useAppointments, fetchAppointments, updateStatus, isLoading } = useAppointments ();
    const { profile } = useAuth ();
    const [filter, setFilter] = useState("pending"); //pending, confirmed, completed

    useEffect(() => {
        fetchAppointments({ status: filter});
    }, [filter, fetchAppointments]);
    const handleConfirm = (id) => updateStatus(id, "confirmed");
    const handleComplete = (id, notes) => updateStatus(id, "completed", notes);
    const handleNoshow = (id) => updateStatus(id, "no_show");

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Citas -{profile?.dependencies?.name}</h1>
                <div className="filter-tabs">
                    {["pending", "confirmed", "completed"].map((status) => (
                        <button 
                        key={status}
                        className={filter === status ? "active": "" }
                        onClick={() => setFilter(status)}
                        >
                        {status === "pending" && "Pendientes"}
                        {status === "confirmed" && "Confirmadas"}
                        {status === "completed" && "Historial"}
                        </button>
                    ))}
                </div>
            </header>

            <div className="appointments-grid">
                {isLoading ? (
                    <p>Cargando citas...</p>
                ) : (
                    appointments.map((apt) => (
                        <div key={apt.id} className="appointments-wrapper">
                            <AppointmentCard appointment={apt} isAprendiz={false}/>

                            {filter === "pending" && (
                                <div className="professional-actions">
                                    <button
                                    onClick={()=> handleConfirm(apt.id)}
                                    className="btn-success"
                                    >
                                        Confirmar
                                    </button>
                                    <button 
                                    onClick={()=> handleNoshow(apt.id)}
                                    className="btn-secondary"
                                    >
                                        No asistió
                                    </button>
                                </div>
                            )}
                            {filter === "confirmed" && (
                                <div className="professional-actions">
                                    <button onClick={() =>
                                        handleComplete(apt.id, "atención completada")
                                        }
                                        className="btn primary"
                                    >
                                        Completar Atención
                                    </button>
                                </div>
                            )}
                            
                        </div>
                    ))
                )}

            </div>
        </div>
    ) 
}