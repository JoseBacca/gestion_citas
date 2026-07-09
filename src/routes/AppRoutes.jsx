import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuth } from "../providers/Authproviders";
import { lazy, Suspense } from "react";

// Public
const Login = lazy(() => import("../features/auth/pages/login.jsx"));
const Register = lazy(() => import("../features/auth/pages/Register.jsx"));
const Unauthorized = lazy(() => import("../shared/components/Unauthorized"));

// Private - Aprendiz
const AprendizDashboard = lazy(() => import("../features/appointments/pages/AprendizDashboard"));

// Private - Profesionales
const ProfessionalDashboard = lazy(() => import("../features/appointments/pages/ProfessionalDashboard"));

// Private - Admin
const AdminDashboard = lazy(() => import("../features/admin/pages/AdminDashboard"));
const CoordinationDashboard = lazy(() => import("../features/admin/pages/CoordinationDashboard"));

// Private - Any role
const ProfilePage = lazy(() => import("../shared/components/ProfilePage"));

const Loading = () => (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <p>Cargando...</p>
    </div>
);

export const AppRoutes = function () {
    const { isAdmin, isCoordination, isProfessional } = useAuth();

    const getHomeRoute = () => {
        if (isAdmin()) return "/admin";
        if (isCoordination()) return "/coordination";
        if (isProfessional()) return "/professional";
        return "/dashboard";
    };

    return (
        <Suspense fallback={<Loading />}>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Protected - Aprendiz */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute requiredRoles="APRENDIZ">
                            <AprendizDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Protected - Profesionales */}
                <Route
                    path="/professional"
                    element={
                        <ProtectedRoute requiredRoles={["PSICOLOGIA", "ENFERMERIA", "TRABAJO_SOCIAL"]}>
                            <ProfessionalDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Protected - Coordinacion */}
                <Route
                    path="/coordination"
                    element={
                        <ProtectedRoute requiredRoles={["COORDINACION", "SUPERADMIN"]}>
                            <CoordinationDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Protected - Admin */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute requiredRoles="SUPERADMIN">
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Protected - Profile (any logged user) */}
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    }
                />

                {/* Initial redirect */}
                <Route path="/" element={<Navigate to={getHomeRoute()} replace />} />

                {/* 404 */}
                <Route path="*" element={
                    <div style={{ textAlign: "center", padding: "var(--space-12)", minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 80, height: 80, borderRadius: "var(--radius-full)", background: "var(--color-error-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-6)" }}>
                            <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-error)" }}>404</span>
                        </div>
                        <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--gray-900)", marginBottom: "var(--space-2)" }}>Pagina no encontrada</h2>
                        <p style={{ color: "var(--gray-500)", marginBottom: "var(--space-6)" }}>La pagina que buscas no existe o fue movida.</p>
                        <a href="/" className="btn-primary">Volver al Inicio</a>
                    </div>
                } />
            </Routes>
        </Suspense>
    );
};
