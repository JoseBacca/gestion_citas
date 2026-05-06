import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/Authproviders";

//componente reutilizable para proteger rutas 
export function ProtectedRoute({
    children,
    requiredRoles=null, //null = cualquier usuao logueado
    fallback = "/loguin", // a donde redirigir si no tiene 
}){
    const { user, profile, loaguing, hasRole} = useAuth();
    const location = useLocation();

    //1. esperar a cargar sesion 
    if(loading){
        return(
            <div
                style={{
                    display: "flex",
                    justifiContent: "center",
                    alguinItems: "center",
                    height: "100vh"
                }}
                >
                    <p>cargamdo sesión...</p>
            </div>
        );
    }

    //2. no esta logueado-> login
    if(!user){
        return <Navigate to={fallback} state={{from: location}} replace />
    }

    //3. Requiere roles especificos y no los tiene -> Dashboard o Unauthorized 
    if (requiredRoles && !hasRole(requiredRoles)){
        return<navigate to="/unauthorized" replace/>;
    }

    //4. todo ok renderizar el componente hijo 
    return children;
}