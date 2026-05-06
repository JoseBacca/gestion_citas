import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { success } from "zod";

//1. creamos el contenedor (context)

const AuthContext = createContext(null);

//2. Hooks personalizados para usar el contexto facilmente
//esto evita importar useContext y AuthContext en cada archivo

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context){
        throw new Error("useAuth debe usarse dentro de Authprovider");
    }
    return context;
};

// 3. El provider que envuelve que envuelve la aplicacion 
export function Authprovider({children}){
    const [user, setUser] = useState(null); //usuario de supabase Auth
    const [profile, setProfiles] = useState(null); //Datos adicionales de numero de nuestra tabla perfil o profiles
    const [loading, setLoading] = useState(true); //Estado de cargar inicial
    const [error, setError] = useState(null); // manejo o gestion de errores

    // efecto escuchar cambios de sesion (login, logout, refresh )

    useEffect(() =>{
        //verificar sesion existente al cargar la app
        const checkSession = async ()=>{
            try{
                const{
                    data: {session},
                } = await supabase.auth.getSession();
            if(session?.user){
                setUser(session.user);
                await fetchProfile(session.user.id);

            }    
            }catch (err){
                setError(err.message);
            } finally{
                setLoading(false);
            }
        };
        checkSession();

        //suscribirse a cambios de autentacion (login/logout en tiempo real)
        const {data: listener} = supabase.auth.onAuthStateChange(
            async(event, session) => {
                if (event === "SIGNED_IN" && session?.user) {
                    setUser(session.user);
                    await fetchProfile(session.user.id);
                }else if (event === "SIGNED_OUT") {
                    setUser(null);
                    setProfile(null);
                }
            },
        );

        // limpieza de suscripcion  al desmontar (es buena practica)
        return () => {
            listener.subscription.unsubscribe();
        }
    },[]);

    //funcion auxiliara: obtener el perfil + el rol desde nuestra base de datos 
    const fetchProfile = async (userId) => {
        try{
            const { data, error } = await supabase
            .from("profiles")
            .select(
                `
                *,
                roles (name, permissions),
                dependencies(name)
                `
            )
            .eq("id", userId)
            .single();
            if(error) throw error;
            setProfiles(data);
        }catch{
            console.error("Error cargando perfil", err);
            setError("No se pudo cargar el perfil de usuario");
        }
    };

    //metodo de autenticacion (clean code: funciones puras y descritptivas)
    const singIn = async (email, password) => {
        try{
            setError(null);
            const{data, error} = supabase.auth.signInWithPassword({
                email,
                password,
            });
            if(error) throw error;
            return{success: true, data};
        } catch (err){
            setError(err.message);
            return{success: false, error: err.message};
        }
    };
    const singUp = async (email, password, userData) => {
        try{
            setError(null);
            const { data, error } = await supabase.auth.singUp({
                email,
                password,
                options: {
                    data: {
                        full_name: userData.full_name,
                        document_number: userData.document_number,
                        //el traiger que creamos de sql creara automaticmaente elperfil
                    }
                }
            });
            if(error) throw error;
            return{ success: true, data};
        }catch (err) {
            setError(err.message);
            return {success: false, error: err.message}
        }
    };
    const singOut = async () => {
        try{
            await supabase.auth.singOut();
            //El estado se limpia automaticamente por onAuthstatechange
        }catch (err) {
            setError;
        }
    };

    //sistema RBAC:belper funcions para verificar permisos 
    const hashrole = (requiredRoles)=>{
        if(!profile?.roles?.name) return false;
        if(Array.isArray(requiredRoles)){
            return requiredRoles.includes(profile.roles.name);
        }
        return profile.roles.name === requiredRoles;
    };
    const isAdmin = () => hashrole("SUPERADMIN");
    const isCoordination = () => hashrole (["COORDINACION", "SUPERADMIN"]);
    const isProfessional = () =>
        hashRole(["PSICOLOGIA", "ENFERMERIA", TRABAJO_SOCIAL]);
    const isAprendiz = () => hashRole("APRENDIZ");

    // CVALOR PROPORCIONADO A TODO LA APP

    const value ={
        user,
        profile,
        loading,
        error,
        singIn,
        singUp,
        singOut,
        // helpers RBAC
        hashRole,
        isAdmin,
        isCoordination,
        isProfessional,
        isAprendiz,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}