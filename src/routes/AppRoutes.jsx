import{Routes, Route} from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuth } from "../providers/Authproviders";
import { Navigate } from "react-router-dom";

// Lzy loading para code splitting (mejor performance)
import { lazy, Suspense } from "react";

//publicas 
const login = lazy(()=> import("../features/auth/pages/login.jsx"));
const register = lazy(() =>import("../features/auth/pages/register"));
const Unauthorized = lazy(()=> import("../shared/components/Unauthorized"));

//privados aprendiz
const AprendizDashboard = lazy(() => import("../features/appointments/pages/AprendizDashboard"));
    () => import("../features/appointments/pages/AprendizDashboard");

//privadas profesional
const ProfessionalDashboard = lazy(() => import("../features/appointments/pages/ProfessionalDashboard"));

//privadas admin
const AdminDashboard = lazy(() => import("../features/admin/pages/AdminDashboard"));


export default function AppRoutes() { 
    const { isAprendiz, isProfessional, isCoordination, isAdmin } = useAuth();

    //Redireccion intleligente segun rol (despues del login)
    const getHomeRoute = () => {
        if (isAdmin()) return "/admin";
        if (isCoordination()) return "/coordination";
        if (isProfessional()) return "/professional";
        return "/dashboard"; //Aprendiz por defecto
    };

    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <Routes>
                {/* Rutas publicas */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Rutas protegidas - APRENDIZ */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute requiredRoles="APRENDIZ">
                            <AprendizDashboard />
                        </ProtectedRoute>
                    }
                />
                
                {/* Rutas protegidas - PROFESIONALES */}
                <Route
                    path="/professional"
                    element={
                        <ProtectedRoute
                        requiredRoles={["PSICOLOGIA","ENFERMERIA", "TRABAJO_SOCIAL"]}
                        >
                            <ProfessionalDashboard />
                        </ProtectedRoute>
                    }
                />

                {/*RUTAS PORTEGIDAS - COORDINACION */}
                <Route
                    path="/coordination"
                    element={
                        <ProtectedRoute
                        requiredRoles={["COORDINACION","SUPERADMIN"]}
                        >
                            <CoordinationDashboard />
                        </ProtectedRoute>
                    }
               />

                {/*RUTAS PORTEGIDAS - ADMIN */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute
                        requiredRoles="SUPERADMIN"
                        >
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
               />

                {/*REDIRECION INICIAL*/}
                <Route 
                    path= "/" element={<Navigate to={getHomeRoute()} replace />} />

                {/*404*/}
                <Route path="*" element={<div>404 - Pagina no encontrada</div>} />
            </Routes>
        </Suspense>
    );
}
