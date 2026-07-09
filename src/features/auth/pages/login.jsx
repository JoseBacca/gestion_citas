import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../providers/Authproviders";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, Mail, Calendar, Shield, Users, Heart } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showReset, setShowReset] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [sendingReset, setSendingReset] = useState(false);
    const { signIn, error } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await signIn(email, password);
        setLoading(false);
        if (result.success) {
            toast.success("Sesion iniciada correctamente");
            const meta = result.data?.user?.user_metadata;
            const role = meta?.role_id || "APRENDIZ";
            if (role === "SUPERADMIN") navigate("/admin");
            else if (role === "COORDINACION") navigate("/coordination");
            else if (["PSICOLOGIA", "ENFERMERIA", "TRABAJO_SOCIAL"].includes(role)) navigate("/professional");
            else navigate("/dashboard");
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!resetEmail) return;
        setSendingReset(true);
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
            redirectTo: `${window.location.origin}/login`,
        });
        setSendingReset(false);
        if (error) { toast.error("Error al enviar el correo."); return; }
        toast.success("Revisa tu email para restablecer la contrasena");
        setShowReset(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-split">
                <div className="auth-brand">
                    <div className="auth-brand-content">
                        <div className="auth-brand-icon"><Heart size={36} /></div>
                        <h2>SENA Bienestar</h2>
                        <p>Plataforma integral de gestion de citas para el bienestar de nuestra comunidad educativa.</p>
                        <div className="auth-brand-features">
                            <div className="auth-feature">
                                <div className="auth-feature-icon"><Calendar size={18} /></div>
                                <span>Agenda tus citas en linea</span>
                            </div>
                            <div className="auth-feature">
                                <div className="auth-feature-icon"><Shield size={18} /></div>
                                <span>Acceso seguro y personalizado</span>
                            </div>
                            <div className="auth-feature">
                                <div className="auth-feature-icon"><Users size={18} /></div>
                                <span>Multi-profesional: Psicologia, Enfermeria y mas</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="auth-form-panel">
                    <div className="auth-card">
                        <div className="auth-card-header">
                            <h1>{showReset ? "Restablecer Contrasena" : "Iniciar Sesion"}</h1>
                            <p className="auth-subtitle">{showReset ? "Ingresa tu email para recibir el enlace" : "Accede a tu cuenta para gestionar tus citas"}</p>
                        </div>
                        {error && <div className="auth-error">{error}</div>}
                        {showReset ? (
                            <form className="auth-form" onSubmit={handleResetPassword}>
                                <div className="field">
                                    <label htmlFor="reset-email">Email</label>
                                    <input id="reset-email" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="tu.email@gmail.com" required disabled={sendingReset} />
                                </div>
                                <button type="submit" disabled={sendingReset} className="btn-primary">
                                    {sendingReset ? <><Loader2 size={18} className="spin" /> Enviando...</> : <><Mail size={18} /> Enviar enlace</>}
                                </button>
                                <div className="auth-footer-actions">
                                    <button type="button" onClick={() => setShowReset(false)} className="btn-link">Volver al inicio de sesion</button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <form className="auth-form" onSubmit={handleSubmit}>
                                    <div className="field">
                                        <label htmlFor="login-email">Email</label>
                                        <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu.email@gmail.com" required disabled={loading} />
                                    </div>
                                    <div className="field">
                                        <label htmlFor="login-password">Contrasena</label>
                                        <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tu contrasena" required disabled={loading} />
                                    </div>
                                    <button type="submit" disabled={loading} className="btn-primary btn-lg">
                                        {loading ? <><Loader2 size={18} className="spin" /> Entrando...</> : "Iniciar Sesion"}
                                    </button>
                                </form>
                                <div className="auth-footer-actions">
                                    <button type="button" onClick={() => setShowReset(true)} className="btn-link">Olvidaste tu contrasena?</button>
                                </div>
                                <div className="auth-divider"><span>o</span></div>
                                <p className="auth-footer">No tienes cuenta? <Link to="/register" className="auth-link">Registrate aqui</Link></p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
