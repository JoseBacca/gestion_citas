import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../../providers/Authproviders";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, User, Mail, CreditCard, Lock, Calendar, Shield, Users, Heart, Hash } from "lucide-react";

export default function Register() {
    const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "", full_name: "", document_number: "", ficha: "", role_id: "APRENDIZ" });
    const [validationError, setValidationError] = useState("");
    const [loading, setLoading] = useState(false);
    const { signUp, error: authError } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationError("");
        if (formData.password !== formData.confirmPassword) { setValidationError("Las contrasenas no coinciden"); return; }
        if (formData.password.length < 6) { setValidationError("La contrasena debe tener al menos 6 caracteres"); return; }
        setLoading(true);
        const userData = { full_name: formData.full_name, document_number: formData.document_number, role_id: formData.role_id };
        if (formData.role_id === "APRENDIZ" && formData.ficha) userData.ficha = formData.ficha;
        const result = await signUp(formData.email, formData.password, userData);
        setLoading(false);
        if (result.success) { toast.success("Registro exitoso! Revisa tu email."); navigate("/login"); }
    };

    const errorMessage = validationError || authError;

    return (
        <div className="auth-page">
            <div className="auth-split">
                <div className="auth-brand">
                    <div className="auth-brand-content">
                        <div className="auth-brand-icon"><Heart size={36} /></div>
                        <h2>SENA Bienestar</h2>
                        <p>Unete a nuestra comunidad y accede a servicios de bienestar integral.</p>
                        <div className="auth-brand-features">
                            <div className="auth-feature"><div className="auth-feature-icon"><Calendar size={18} /></div><span>Agenda citas con profesionales</span></div>
                            <div className="auth-feature"><div className="auth-feature-icon"><Shield size={18} /></div><span>Tu informacion esta protegida</span></div>
                            <div className="auth-feature"><div className="auth-feature-icon"><Users size={18} /></div><span>Equipo multidisciplinario</span></div>
                        </div>
                    </div>
                </div>
                <div className="auth-form-panel">
                    <div className="auth-card">
                        <div className="auth-card-header">
                            <h1>Crear Cuenta</h1>
                            <p className="auth-subtitle">Registrate para acceder a los servicios de bienestar</p>
                        </div>
                        {errorMessage && <div className="auth-error">{errorMessage}</div>}
                        <form className="auth-form" onSubmit={handleSubmit}>
                            <div className="field"><label><Shield size={14} /> Rol</label><select name="role_id" value={formData.role_id} onChange={handleChange} required><option value="APRENDIZ">Aprendiz</option><option value="COORDINACION">Coordinacion</option><option value="PSICOLOGIA">Psicologia</option><option value="ENFERMERIA">Enfermeria</option><option value="TRABAJO_SOCIAL">Trabajo Social</option></select></div>
                            <div className="field"><label><User size={14} /> Nombre completo</label><input type="text" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Tu nombre completo" required /></div>
                            <div className="field"><label><CreditCard size={14} /> Numero de documento</label><input type="text" name="document_number" value={formData.document_number} onChange={handleChange} placeholder="Ej: 1098765432" required /></div>
                            {formData.role_id === "APRENDIZ" && (
                                <div className="field"><label><Hash size={14} /> Numero de ficha</label><input type="text" name="ficha" value={formData.ficha} onChange={handleChange} placeholder="Ej: 2567890" required /></div>
                            )}
                            <div className="field"><label><Mail size={14} /> Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="tu.email@gmail.com" required /></div>
                            <div className="field-row">
                                <div className="field"><label><Lock size={14} /> Contrasena</label><input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min. 6 caracteres" required /></div>
                                <div className="field"><label><Lock size={14} /> Confirmar</label><input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Repite tu contrasena" required /></div>
                            </div>
                            <button type="submit" disabled={loading} className="btn-primary btn-lg">{loading ? <><Loader2 size={18} className="spin" /> Creando cuenta...</> : "Crear Cuenta"}</button>
                        </form>
                        <div className="auth-divider"><span>o</span></div>
                        <p className="auth-footer">Ya tienes cuenta? <Link to="/login" className="auth-link">Inicia sesion</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
