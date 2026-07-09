import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentSchema } from "../validations/appointments.schema";
import { useAppointments } from "./hooks/UseAppointments";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { TimeSlotPicker } from "./TimeSlotPicker";
import { CalendarDays, Clock, FileText, Loader2, ArrowRight, ArrowLeft, Check, MapPin } from "lucide-react";

export function AppointmentForm({ onSuccess, defaultDependencyId }) {
    const { createAppointment, isCreating } = useAppointments();
    const [dependencies, setDependencies] = useState([]);
    const [depName, setDepName] = useState("");
    const [step, setStep] = useState(1);

    const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm({
        resolver: zodResolver(appointmentSchema),
        defaultValues: { dependency_id: undefined, scheduled_date: "", scheduled_time: "", reason: "" },
    });

    // eslint-disable-next-line react-hooks/incompatible-library
    const watchedDependencyId = watch("dependency_id");
    const watchedDate = watch("scheduled_date");
    const watchedTime = watch("scheduled_time");

    useEffect(() => {
        async function loadDependencies() {
            const { data } = await supabase.from("dependencies").select("*");
            setDependencies(data || []);
        }
        loadDependencies();
    }, []);

    useEffect(() => {
        if (defaultDependencyId && dependencies.length > 0) {
            const dep = dependencies.find((d) => d.id === defaultDependencyId);
            if (dep) setDepName(dep.name);
            setValue("dependency_id", defaultDependencyId);
        }
    }, [defaultDependencyId, dependencies, setValue]);

    const nextStep = async () => {
        if (step === 1) { const valid = await trigger("dependency_id"); if (valid) setStep(2); }
        else if (step === 2) { const valid = await trigger(["scheduled_date", "scheduled_time"]); if (valid) setStep(3); }
        else if (step === 3) { setStep(4); }
    };

    const prevStep = () => setStep((s) => s - 1);

    const onSubmit = async (data) => {
        const result = await createAppointment(data);
        if (result.success) onSuccess?.();
    };

    return (
        <div>
            <div className="form-steps">
                <div className={`form-step ${step >= 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}>
                    <span className="form-step-number">{step > 1 ? <Check size={14} /> : "1"}</span>
                    <span className="form-step-label">Servicio</span>
                </div>
                <div className={`form-step-divider ${step > 1 ? "completed" : ""}`}></div>
                <div className={`form-step ${step >= 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}>
                    <span className="form-step-number">{step > 2 ? <Check size={14} /> : "2"}</span>
                    <span className="form-step-label">Fecha y Hora</span>
                </div>
                <div className={`form-step-divider ${step > 2 ? "completed" : ""}`}></div>
                <div className={`form-step ${step >= 3 ? "active" : ""} ${step > 3 ? "completed" : ""}`}>
                    <span className="form-step-number">{step > 3 ? <Check size={14} /> : "3"}</span>
                    <span className="form-step-label">Detalle</span>
                </div>
                <div className={`form-step-divider ${step > 3 ? "completed" : ""}`}></div>
                <div className={`form-step ${step >= 4 ? "active" : ""}`}>
                    <span className="form-step-number">4</span>
                    <span className="form-step-label">Confirmar</span>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="appointment-form">
                {step === 1 && (
                    <div className="animate-fade-in">
                        <div className="field"><label><MapPin size={16} /> Dependencia seleccionada</label>
                        <p style={{ fontWeight: 600, color: "var(--sena-green)", margin: 0, fontSize: "var(--text-lg)", padding: "var(--space-3) 0" }}>{depName}</p></div>
                        {errors.dependency_id && <span className="error">{errors.dependency_id.message}</span>}
                    </div>
                )}
                {step === 2 && (
                    <div className="animate-fade-in">
                        <div className="field"><label><CalendarDays size={16} /> Fecha de la cita</label>
                        <input type="date" {...register("scheduled_date")} min={new Date().toISOString().split("T")[0]} />
                        {errors.scheduled_date && <span className="error">{errors.scheduled_date.message}</span>}</div>
                        <div className="field" style={{ marginTop: "var(--space-5)" }}><label><Clock size={16} /> Horario disponible</label>
                        {!watchedDependencyId || !watchedDate ? <p className="text-muted">Selecciona una fecha para ver horarios disponibles</p> : <TimeSlotPicker dependencyId={watchedDependencyId} date={watchedDate} value={watch("scheduled_time")} onChange={(time) => setValue("scheduled_time", time, { shouldValidate: true })} />}
                        {errors.scheduled_time && <span className="error">{errors.scheduled_time.message}</span>}</div>
                    </div>
                )}
                {step === 3 && (
                    <div className="animate-fade-in">
                        <div className="field"><label><FileText size={16} /> Motivo de consulta</label>
                        <textarea {...register("reason")} rows="4" placeholder="Describe brevemente el motivo de tu cita (min. 10 caracteres)..." autoFocus />
                        {errors.reason && <span className="error">{errors.reason.message}</span>}</div>
                    </div>
                )}
                {step === 4 && (
                    <div className="animate-fade-in" style={{ textAlign: "center" }}>
                        <div style={{ width: 64, height: 64, borderRadius: "var(--radius-full)", background: "var(--sena-green-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-5)" }}>
                            <Check size={32} color="var(--sena-green)" />
                        </div>
                        <h3 style={{ marginBottom: "var(--space-4)", color: "var(--gray-800)" }}>Confirma tu cita</h3>
                        <div style={{ background: "var(--gray-50)", borderRadius: "var(--radius-md)", padding: "var(--space-5)", textAlign: "left" }}>
                            <p style={{ marginBottom: "var(--space-2)" }}><strong>Servicio:</strong> {depName}</p>
                            <p style={{ marginBottom: "var(--space-2)" }}><strong>Fecha:</strong> {watchedDate}</p>
                            <p style={{ marginBottom: "var(--space-2)" }}><strong>Hora:</strong> {watchedTime}</p>
                            <p style={{ marginBottom: 0 }}><strong>Motivo:</strong> {watch("reason")}</p>
                        </div>
                    </div>
                )}

                <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
                    {step > 1 && <button type="button" onClick={prevStep} className="btn-secondary" style={{ flex: 1 }}><ArrowLeft size={16} /> Atras</button>}
                    {step < 4 ? <button type="button" onClick={nextStep} className="btn-primary" style={{ flex: 1 }}>Siguiente <ArrowRight size={16} /></button> : <button type="submit" disabled={isCreating} className="btn-primary btn-lg" style={{ flex: 1 }}>{isCreating ? <><Loader2 size={18} className="spin" /> Agendando...</> : <><Check size={18} /> Confirmar Cita</>}</button>}
                </div>
            </form>
        </div>
    );
}
