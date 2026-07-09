import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../providers/Authproviders";
import { User, Save, Loader2, Mail, CreditCard, Building2, Shield, Edit2, Lock, Eye, EyeOff, Key } from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS = { APRENDIZ: "Aprendiz", PSICOLOGIA: "Psicologia", ENFERMERIA: "Enfermeria", TRABAJO_SOCIAL: "Trabajo Social", COORDINACION: "Coordinacion", SUPERADMIN: "Administrador" };
const ROLE_COLORS = { APRENDIZ: { bg: "var(--color-warning-light)", color: "#92400e" }, PSICOLOGIA: { bg: "#f3e8ff", color: "#6b21a8" }, ENFERMERIA: { bg: "var(--color-error-light)", color: "#991b1b" }, TRABAJO_SOCIAL: { bg: "#fef3c7", color: "#92400e" }, COORDINACION: { bg: "var(--color-info-light)", color: "#1e40af" }, SUPERADMIN: { bg: "var(--primary-light)", color: "var(--primary-dark)" } };

export default function ProfilePage() {
    const { profile, user: authUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [fullName, setFullName] = useState(profile?.full_name || "");
    const [documentNumber, setDocumentNumber] = useState(profile?.document_number || "");
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");

    // Password state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    if (!authUser || !profile) return <div style={{ textAlign: "center", padding: "3rem" }}><Loader2 size={32} className="spin" color="var(--primary)" /><p style={{ marginTop: "1rem", color: "var(--gray-500)" }}>Cargando perfil...</p></div>;

    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase.from("profiles").update({ full_name: fullName, document_number: documentNumber }).eq("id", authUser.id);
        setSaving(false);
        if (error) { toast.error("Error actualizando perfil"); return; }
        toast.success("Perfil actualizado"); setEditing(false); window.location.reload();
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) { toast.error("Completa todos los campos"); return; }
        if (newPassword.length < 6) { toast.error("La nueva contraseña debe tener al menos 6 caracteres"); return; }
        if (newPassword !== confirmPassword) { toast.error("Las contraseñas no coinciden"); return; }
        if (currentPassword === newPassword) { toast.error("La nueva contraseña debe ser diferente a la actual"); return; }

        setChangingPassword(true);
        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({ email: authUser.email, password: currentPassword });
            if (signInError) { toast.error("La contraseña actual es incorrecta"); setChangingPassword(false); return; }

            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) { toast.error("Error cambiando contraseña: " + error.message); return; }

            toast.success("Contraseña cambiada correctamente");
            setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
        } catch (err) {
            toast.error("Error inesperado: " + err.message);
        } finally {
            setChangingPassword(false);
        }
    };

    const roleName = ROLE_LABELS[profile.role_id] || profile.role_id || "";
    const roleColor = ROLE_COLORS[profile.role_id] || { bg: "var(--gray-100)", color: "var(--gray-600)" };
    const initials = (profile.full_name || "U").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

    const inputStyle = { border: "1.5px solid var(--gray-200)", borderRadius: "var(--radius-md)", padding: "var(--space-3)", fontSize: "var(--text-sm)", width: "100%", fontFamily: "var(--font-sans)", color: "var(--gray-800)", background: "var(--surface)" };
    const disabledInputStyle = { ...inputStyle, background: "var(--gray-50)", color: "var(--gray-500)" };

    return (
        <div className="dashboard-container" style={{ maxWidth: 640, margin: "0 auto" }}>
            <div className="page-header"><div className="page-header-left"><h1>Mi Perfil</h1><p>Administra tu informacion y seguridad</p></div></div>

            <div className="filter-tabs" style={{ marginBottom: "var(--space-6)" }}>
                <button className={activeTab === "profile" ? "active" : ""} onClick={() => setActiveTab("profile")}><User size={14} /> Informacion</button>
                <button className={activeTab === "password" ? "active" : ""} onClick={() => setActiveTab("password")}><Lock size={14} /> Contraseña</button>
            </div>

            {activeTab === "profile" && (
                <div className="profile-card">
                    <div style={{ textAlign: "center", marginBottom: "var(--space-8)" }}>
                        <div className="profile-avatar"><span style={{ fontSize: "var(--text-2xl)", fontWeight: 800 }}>{initials}</span></div>
                        <h1>{profile.full_name || "Sin nombre"}</h1>
                        <span className="status-badge" style={{ background: roleColor.bg, color: roleColor.color }}><Shield size={12} /> {roleName}</span>
                    </div>
                    <div className="profile-details">
                        <div className="profile-field"><label><Mail size={12} /> Email</label><input type="email" value={authUser.email || ""} disabled style={disabledInputStyle} /></div>
                        <div className="profile-field"><label><User size={12} /> Nombre completo</label>{editing ? <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} /> : <p>{profile.full_name || "Sin nombre"}</p>}</div>
                        <div className="profile-field"><label><CreditCard size={12} /> Documento</label>{editing ? <input type="text" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} style={inputStyle} /> : <p>{profile.document_number || "Sin documento"}</p>}</div>
                        <div className="profile-field"><label><Building2 size={12} /> Dependencia</label><p>{profile.dependency?.name || "Sin asignar"}</p></div>
                    </div>
                    <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-8)" }}>
                        {editing ? (
                            <><button onClick={() => setEditing(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                            <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 1 }}>{saving ? <><Loader2 size={16} className="spin" /> Guardando...</> : <><Save size={16} /> Guardar</>}</button></>
                        ) : (
                            <button onClick={() => { setFullName(profile.full_name || ""); setDocumentNumber(profile.document_number || ""); setEditing(true); }} className="btn-primary" style={{ width: "100%" }}><Edit2 size={16} /> Editar Perfil</button>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "password" && (
                <div className="profile-card">
                    <div style={{ textAlign: "center", marginBottom: "var(--space-6)" }}>
                        <div style={{ width: 64, height: 64, borderRadius: "var(--radius-full)", background: "var(--color-info-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-4)" }}>
                            <Key size={28} color="var(--color-info)" />
                        </div>
                        <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--gray-900)" }}>Cambiar Contraseña</h2>
                        <p style={{ fontSize: "var(--text-sm)", color: "var(--gray-500)" }}>Asegurate de usar una contraseña segura</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
                        <div className="field">
                            <label><Lock size={12} /> Contraseña actual</label>
                            <div style={{ position: "relative" }}>
                                <input type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Ingresa tu contraseña actual" style={{ ...inputStyle, paddingRight: "2.5rem" }} />
                                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", color: "var(--gray-400)", cursor: "pointer", padding: 4 }}>
                                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="field">
                            <label><Lock size={12} /> Nueva contraseña</label>
                            <div style={{ position: "relative" }}>
                                <input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimo 6 caracteres" style={{ ...inputStyle, paddingRight: "2.5rem" }} />
                                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", color: "var(--gray-400)", cursor: "pointer", padding: 4 }}>
                                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {newPassword && newPassword.length < 6 && <span className="error" style={{ marginTop: 4 }}>Minimo 6 caracteres</span>}
                        </div>
                        <div className="field">
                            <label><Lock size={12} /> Confirmar contraseña</label>
                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repite la nueva contraseña" style={inputStyle} />
                            {confirmPassword && newPassword !== confirmPassword && <span className="error" style={{ marginTop: 4 }}>Las contraseñas no coinciden</span>}
                        </div>
                        <button onClick={handleChangePassword} disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword} className="btn-primary" style={{ width: "100%", marginTop: "var(--space-2)" }}>
                            {changingPassword ? <><Loader2 size={16} className="spin" /> Cambiando...</> : <><Key size={16} /> Cambiar Contraseña</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
