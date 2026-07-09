import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth debe usarse dentro de Authprovider");
    }
    return context;
};

export function Authprovider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const timer = setTimeout(() => setLoading(false), 8000);

        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (cancelled) return;
                if (session?.user) {
                    setUser(session.user);
                    await fetchProfile(session.user.id);
                }
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                    clearTimeout(timer);
                }
            }
        };
        checkSession();

        const { data: listener } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (event === "SIGNED_IN" && session?.user) {
                    setUser(session.user);
                    fetchProfile(session.user.id);
                } else if (event === "SIGNED_OUT") {
                    setUser(null);
                    setProfile(null);
                }
            },
        );

        return () => {
            clearTimeout(timer);
            cancelled = true;
            listener.subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (userId) => {
        try {
            // profiles.role_id es TEXT con el nombre del rol (ej: "APRENDIZ")
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();
            if (error) throw error;

            // Obtener dependencia si tiene dependency_id
            let dep = null;
            if (data.dependency_id) {
                const { data: depData } = await supabase
                    .from("dependencies")
                    .select("*")
                    .eq("id", data.dependency_id)
                    .single();
                dep = depData;
            }

            setProfile({ ...data, dependency: dep });
        } catch (err) {
            console.warn("Perfil no disponible:", err.message);
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const meta = session.user.user_metadata || {};
                setProfile({
                    id: userId,
                    full_name: meta.full_name || "",
                    document_number: meta.document_number || "",
                    email: session.user.email,
                    role_id: meta.role_id || "APRENDIZ",
                    dependency: null,
                });
            }
        }
    };

    const getErrorMessage = (err) => {
        const code = err?.code || err?.status;
        const msg = err?.message || "";

        if (code === "429" || msg.includes("429") || msg.includes("rate_limit") || msg.includes("Too many requests")) {
            return "Demasiados intentos. Espera un minuto e intenta de nuevo.";
        }
        if (msg.includes("Email not confirmed") || msg.includes("email_not_confirmed")) {
            return "Email no confirmado. Revisa tu bandeja de entrada o contacta al administrador.";
        }
        if (msg.includes("Invalid login credentials")) {
            return "Email o contrasena incorrectos.";
        }
        if (msg.includes("User already registered")) {
            return "Este email ya esta registrado. Inicia sesion.";
        }
        return msg || "Error de conexion. Intenta de nuevo.";
    };

    const signIn = async (email, password) => {
        try {
            setError(null);
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            return { success: true, data };
        } catch (err) {
            const message = getErrorMessage(err);
            setError(message);
            return { success: false, error: message };
        }
    };

    const signUp = async (email, password, userData) => {
        try {
            setError(null);
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: userData.full_name,
                        document_number: userData.document_number,
                        role_id: userData.role_id || "APRENDIZ",
                    }
                }
            });
            if (error) throw error;
            if (data?.user?.identities?.length === 0) {
                const message = "Este email ya esta registrado. Inicia sesion.";
                setError(message);
                return { success: false, error: message };
            }
            return { success: true, data };
        } catch (err) {
            const message = getErrorMessage(err);
            setError(message);
            return { success: false, error: message };
        }
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            setError(err.message);
        }
    };

    // role_id es TEXT directo ("APRENDIZ", "SUPERADMIN", etc.)
    const roleName = profile?.role_id || null;

    const hashRole = (requiredRoles) => {
        if (!roleName) return false;
        if (Array.isArray(requiredRoles)) {
            return requiredRoles.includes(roleName);
        }
        return roleName === requiredRoles;
    };

    const isAdmin = () => hashRole("SUPERADMIN");
    const isCoordination = () => hashRole(["COORDINACION", "SUPERADMIN"]);
    const isProfessional = () => hashRole(["PSICOLOGIA", "ENFERMERIA", "TRABAJO_SOCIAL"]);
    const isAprendiz = () => hashRole("APRENDIZ");

    const value = {
        user,
        profile,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        hashRole,
        isAdmin,
        isCoordination,
        isProfessional,
        isAprendiz,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}