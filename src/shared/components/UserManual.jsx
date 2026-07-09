import { BookOpen, ArrowLeft, User, Calendar, Clock, CheckCircle, AlertCircle, FileText, Search, Download, Settings, Shield, Heart, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import "./manual.css";

const SECTIONS = [
    {
        id: "inicio",
        icon: Heart,
        title: "Bienvenida",
        content: `El Sistema de Bienestar SENA es una plataforma digital que permite a los aprendices del SENA agendar y gestionar citas de bienestar (Psicologia, Enfermeria y Trabajo Social) de forma rapida y sencilla.`
    },
    {
        id: "registro",
        icon: User,
        title: "Registro e Inicio de Sesion",
        steps: [
            { text: "Ingresa a la pagina de inicio y haz clic en 'Registrate aqui'", hint: "Se encuentra debajo del formulario de login" },
            { text: "Completa el formulario con tu nombre completo, numero de documento y correo electronico", hint: "Usa tu correo institucional del SENA" },
            { text: "Crea una contrasena segura (minimo 6 caracteres)", hint: "Combina letras, numeros y simbolos" },
            { text: "Haz clic en 'Crear Cuenta' y confirma tu correo electronico", hint: "Revisa tu bandeja de entrada" },
            { text: "Una vez confirmado, inicia sesion con tu correo y contrasena", hint: "" }
        ]
    },
    {
        id: "agendar",
        icon: Calendar,
        title: "Agendar una Cita",
        sections: [
            {
                subtitle: "Paso 1: Seleccionar Dependencia",
                description: "Desde tu panel principal, veras las tarjetas de las dependencias disponibles. Haz clic en la dependencia que necesitas.",
                example: {
                    title: "Ejemplo",
                    text: "Si necesitas atencion psicologica, haz clic en la tarjeta 'Psicologia'. Cada tarjeta muestra un icono y descripcion de los servicios."
                }
            },
            {
                subtitle: "Paso 2: Seleccionar Fecha",
                description: "En el calendario que aparece, selecciona la fecha en la que deseas tu cita. Los dias disponibles estan resaltados.",
                example: {
                    title: "Consejo",
                    text: "Los dias en verde indican disponibilidad. Si un dia esta gris, no hay cupos disponibles."
                }
            },
            {
                subtitle: "Paso 3: Seleccionar Hora",
                description: "Se mostraran los horarios disponibles para la fecha elegida. Selecciona el horario que mejor se ajuste a tu agenda.",
                example: {
                    title: "Ejemplo",
                    text: "Si seleccionaste el lunes 15 de julio, veras horarios como 08:00, 08:30, 09:00, etc. Los horarios en verde estan disponibles."
                }
            },
            {
                subtitle: "Paso 4: Describir el Motivo",
                description: "Escribe brevemente el motivo de tu consulta. Esto ayudara al profesional a prepararse para tu atencion.",
                example: {
                    title: "Ejemplo de motivo",
                    text: "'Sesion de orientacion vocacional' o 'Control de presion arterial' o 'Acompanamiento psicologico'"
                }
            },
            {
                subtitle: "Paso 5: Confirmar",
                description: "Revisa los datos de tu cita y haz clic en 'Confirmar Cita'. Recibiras una notificacion de confirmacion.",
                example: {
                    title: "Importante",
                    text: "Una vez confirmada, la cita aparecera en tu lista de 'Mis Citas' con estado 'Pendiente'."
                }
            }
        ]
    },
    {
        id: "gestionar",
        icon: Settings,
        title: "Gestionar Mis Citas",
        items: [
            {
                title: "Ver mis citas",
                description: "En el menu lateral, haz clic en 'Inicio' para ver todas tus citas. Puedes filtrar por estado: Pendientes, Confirmadas o Historial."
            },
            {
                title: "Cancelar una cita",
                description: "Si necesitas cancelar, haz clic en el boton de cancelar en la tarjeta de la cita. Se notificara al profesional."
            },
            {
                title: "Ver detalles",
                description: "Haz clic en cualquier cita para ver los detalles completos: fecha, hora, profesional asignado y motivo."
            }
        ]
    },
    {
        id: "notificaciones",
        icon: AlertCircle,
        title: "Notificaciones",
        description: "El sistema te enviara notificaciones importantes:",
        items: [
            { title: "Confirmacion de cita", description: "Cuando tu cita es confirmada por el profesional" },
            { title: "Recordatorios", description: "Un dia antes de tu cita programada" },
            { title: "Cambios de estado", description: "Si tu cita es cancelada o reagendada" }
        ]
    },
    {
        id: "perfil",
        icon: User,
        title: "Mi Perfil",
        description: "Puedes acceder a tu perfil desde el menu lateral. Alli puedes:",
        items: [
            { title: "Ver tu informacion", description: "Nombre, correo, documento y rol asignado" },
            { title: "Cambiar contrasena", description: "Desde la configuracion de tu cuenta" }
        ]
    },
    {
        id: "consejos",
        icon: FileText,
        title: "Consejos y Recomendaciones",
        items: [
            { title: "Llega puntual", description: "Presentate 5 minutos antes de tu hora agendada" },
            { title: "Prepara tu cedula", description: "Ten tu numero de documento a la mano" },
            { title: "Sé claro", description: "Describe brevemente tu motivo de consulta" },
            { title: "Cancela con antelacion", description: "Si no puedes asistir, cancela al menos 24 horas antes" }
        ]
    }
];

const FAQ = [
    { q: "Puedo cambiar la fecha de mi cita?", a: "Si, puedes cancelar la cita actual y agendar una nueva fecha desde tu panel." },
    { q: "Que hago si olvido mi contrasena?", a: "En la pagina de login, haz clic en 'Olvidaste tu contrasena' y sigue las instrucciones que llegaran a tu correo." },
    { q: "Puedo agendar cita con un profesional especifico?", a: "El sistema asigna automaticamente al profesional disponible. Si necesitas uno especifico, contacta a coordinacion." },
    { q: "Las citas son gratuitas?", a: "Si, todas las citas de bienestar del SENA son totalmente gratuitas para los aprendices." },
    { q: "Que documentos debo llevar?", a: "Tu numero de documento de identidad y tu tarjeta del SENA si la tienes." }
];

export default function UserManual() {
    return (
        <div className="manual-page">
            <div className="manual-container">
                <div className="manual-header">
                    <Link to="/" className="manual-back"><ArrowLeft size={18} /> Volver al sistema</Link>
                    <div className="manual-header-content">
                        <div className="manual-icon"><BookOpen size={32} /></div>
                        <h1>Manual de Usuario</h1>
                        <p>Guia completa para usar el Sistema de Bienestar SENA</p>
                        <span className="manual-version">Version 1.0 - Julio 2026</span>
                    </div>
                </div>

                <nav className="manual-toc">
                    <h3>Contenido</h3>
                    <ul>
                        {SECTIONS.map((s) => (
                            <li key={s.id}>
                                <a href={`#${s.id}`}>
                                    <s.icon size={14} />
                                    <span>{s.title}</span>
                                    <ChevronRight size={14} />
                                </a>
                            </li>
                        ))}
                        <li>
                            <a href="#faq">
                                <AlertCircle size={14} />
                                <span>Preguntas Frecuentes</span>
                                <ChevronRight size={14} />
                            </a>
                        </li>
                    </ul>
                </nav>

                {SECTIONS.map((section) => (
                    <section key={section.id} id={section.id} className="manual-section">
                        <div className="manual-section-header">
                            <section.icon size={22} />
                            <h2>{section.title}</h2>
                        </div>

                        {section.content && <p className="manual-text">{section.content}</p>}

                        {section.steps && (
                            <div className="manual-steps">
                                {section.steps.map((step, i) => (
                                    <div key={i} className="manual-step">
                                        <div className="manual-step-number">{i + 1}</div>
                                        <div className="manual-step-content">
                                            <p>{step.text}</p>
                                            {step.hint && <span className="manual-hint">{step.hint}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {section.sections && section.sections.map((sub, i) => (
                            <div key={i} className="manual-subsection">
                                <h3>{sub.subtitle}</h3>
                                <p>{sub.description}</p>
                                {sub.example && (
                                    <div className="manual-example">
                                        <div className="manual-example-header">
                                            <CheckCircle size={14} />
                                            <span>{sub.example.title}</span>
                                        </div>
                                        <p>{sub.example.text}</p>
                                    </div>
                                )}
                            </div>
                        ))}

                        {section.items && (
                            <div className="manual-items">
                                {section.items.map((item, i) => (
                                    <div key={i} className="manual-item">
                                        <h4>{item.title}</h4>
                                        <p>{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                ))}

                <section id="faq" className="manual-section">
                    <div className="manual-section-header">
                        <AlertCircle size={22} />
                        <h2>Preguntas Frecuentes</h2>
                    </div>
                    <div className="manual-faq">
                        {FAQ.map((faq, i) => (
                            <details key={i} className="manual-faq-item">
                                <summary>{faq.q}</summary>
                                <p>{faq.a}</p>
                            </details>
                        ))}
                    </div>
                </section>

                <div className="manual-footer">
                    <p>Manual de Usuario - Sistema de Bienestar SENA</p>
                    <p>Version 1.0 - Julio 2026</p>
                </div>
            </div>
        </div>
    );
}
