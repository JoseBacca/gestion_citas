import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../../providers/AuthProvider";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        full_name: "",
        document_number: "",
    });
    const { validationError, setValidationError} = useAuth("");
    const { signUp, error: authError } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const{ name, value} = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationError("");
        if (formData.password !== formData.confirmPassword) {
            setValidationError("Las contraseñas no coinciden");
            return;
        }
        if (formData.password.length < 6) {
            setValidationError("La contraseña debe tener al menos 6 caracteres");
            return;
        }
        const result = await signUp(formData.email, formData.password, { full_name: formData.full_name, document_number: formData.document_number,
        });
        if (result.success) {
            toast.success("Registro exitoso! Revisa tu email para confirmar la cuenta.");
            navigate("/login");
        }
    }
    const errorMessage = validationError || authError;
    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>Crear Cuenta</h1>
                <p className="auth-subtitle">SENA Bienestar — Agenda tus citas de bienestar</p>
                {errorMessage && <div className="auth-error">{errorMessage}</div>}
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="field">
                        <label htmlFor="reg-fullname">Nombre completo</label>
                        <input
                            type="text"
                            id="reg-fullname"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="reg-document">Número de documento</label>
                        <input
                            type="text"
                            id="reg-document"
                            name="document_number"
                            value={formData.document_number}
                            onChange={handleChange}
                            required
                            placeholder="Ej: 1234567890"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="reg-email">Email Institucional</label>
                        <input
                            type="email"
                            id="reg-email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="tu.email@soy.sena.edu.co"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="reg-password">Contraseña</label>
                        <input
                            type="password"
                            id="reg-password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="reg-confirm">Confirmar Contraseña</label>
                        <input
                            type="password"
                            id="reg-confirm"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary">
                        Crear Cuenta
                    </button>
                </form>
                <p className="auth-footer">
                    ¿Ya tienes cuenta?{" "}<a href="/login">Inicia sesión</a>
                </p>
            </div>
        </div>
    );
}