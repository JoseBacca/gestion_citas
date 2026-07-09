import { Code, ArrowLeft, Database, Server, Shield, Settings, Terminal, Layers, GitBranch, Lock, Globe, FileText, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import "./manual.css";

const SECTIONS = [
    {
        id: "arquitectura",
        icon: Layers,
        title: "Arquitectura del Sistema",
        content: `El sistema SENA Bienestar es una SPA (Single Page Application) construida con React 19, utilizando Supabase como backend (autenticacion, base de datos y funciones serverless).`,
        subsections: [
            {
                title: "Stack Tecnologico",
                items: [
                    { label: "Frontend", value: "React 19.2 + React Router 7 + Vite 8" },
                    { label: "Backend", value: "Supabase (Auth + PostgreSQL + Realtime)" },
                    { label: "Formularios", value: "react-hook-form + Zod (validacion)" },
                    { label: "UI", value: "lucide-react (iconos), sonner (toasts)" },
                    { label: "Fechas", value: "date-fns" },
                    { label: "CSS", value: "Custom properties, dark mode nativo" }
                ]
            },
            {
                title: "Estructura de Directorios",
                code: `src/
├── main.jsx                    # Entry point
├── App.jsx                     # Layout principal (sidebar + rutas)
├── lib/supabase.js             # Cliente Supabase
├── providers/
│   ├── Authproviders.jsx       # Context de autenticacion
│   ├── ThemeContext.jsx         # Dark/light mode
│   └── NotificationContext.jsx  # Notificaciones realtime
├── routes/
│   ├── AppRoutes.jsx           # Rutas con lazy loading
│   └── ProtectedRoute.jsx      # Guard de autenticacion
├── features/
│   ├── auth/pages/             # Login, Register
│   ├── appointments/           # CRUD de citas
│   │   ├── api/                # AppointmentRepository
│   │   ├── validations/        # Schema Zod
│   │   ├── components/hooks/   # useAppointments
│   │   ├── components/         # AppointmentForm, etc
│   │   └── pages/              # Dashboards
│   ├── admin/pages/            # AdminDashboard
│   └── dashboard/api/          # DashboardRepository
└── shared/
    ├── components/             # Sidebar, CalendarView, etc
    └── Styles/                 # CSS modular`
            }
        ]
    },
    {
        id: "auth",
        icon: Lock,
        title: "Sistema de Autenticacion",
        content: "La autenticacion esta gestionada por Supabase Auth con email/password. El contexto Authprovider maneja el estado global del usuario.",
        subsections: [
            {
                title: "Flujo de Autenticacion",
                steps: [
                    "El usuario ingresa email y password en el formulario de Login",
                    "Se llama a supabase.auth.signInWithPassword()",
                    "El Authprovider detecta el evento SIGNED_IN via onAuthStateChange",
                    "Se ejecuta fetchProfile() para obtener el rol desde la tabla profiles",
                    "El useEffect en Login redirige segun el role_id del perfil"
                ]
            },
            {
                title: "Roles y Permisos",
                code: `// Roles disponibles en el sistema
APRENDIZ          -> /dashboard        (agenda citas)
PSICOLOGIA        -> /professional     (administra agenda)
ENFERMERIA        -> /professional     (administra agenda)
TRABAJO_SOCIAL    -> /professional     (administra agenda)
COORDINACION      -> /coordination     (vista global)
SUPERADMIN        -> /admin            (CRUD usuarios)

// Uso en componentes
const { hasRole, isAdmin, isProfessional } = useAuth();

// Proteger rutas
<ProtectedRoute requiredRoles="SUPERADMIN">
    <AdminDashboard />
</ProtectedRoute>`
            }
        ]
    },
    {
        id: "database",
        icon: Database,
        title: "Base de Datos",
        content: "PostgreSQL en Supabase con RLS (Row Level Security) habilitado.",
        subsections: [
            {
                title: "Tablas Principales",
                code: `-- Perfiles de usuario
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT,
    document_number TEXT UNIQUE,
    role_id TEXT DEFAULT 'APRENDIZ',
    dependency_id INTEGER REFERENCES dependencies(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Citas
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    professional_id UUID REFERENCES profiles(id),
    dependency_id INTEGER REFERENCES dependencies(id),
    status TEXT DEFAULT 'pending',
    scheduled_date DATE,
    scheduled_time TIME,
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dependencias
CREATE TABLE dependencies (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#10b981'
);

-- Notificaciones
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    title TEXT,
    message TEXT,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);`
            },
            {
                title: "Funciones RPC",
                code: `-- KPIs del dashboard admin
CREATE FUNCTION get_dashboard_kpis()
RETURNS TABLE (
    total_appointments BIGINT,
    completed_appointments BIGINT,
    pending_appointments BIGINT,
    total_users BIGINT
);

-- Tendencia mensual
CREATE FUNCTION get_monthly_appointments()
RETURNS TABLE (
    month TEXT,
    total BIGINT,
    completed BIGINT
);`
            }
        ]
    },
    {
        id: "repositories",
        icon: Server,
        title: "Patron Repository",
        content: "Toda la logica de acceso a datos esta encapsulada en repositories que abstraen las llamadas a Supabase.",
        subsections: [
            {
                title: "AppointmentRepository",
                code: `// src/features/appointments/api/appointments.repository.js

export const AppointmentRepository = {
    async fetchByUser(userId, filters = {}) {
        let query = supabase
            .from('appointments')
            .select('*, dependencies(name), profiles!user_id(full_name)')
            .eq('user_id', userId)
            .order('scheduled_date', { ascending: false });

        if (filters.status) query = query.eq('status', filters.status);
        return query;
    },

    async create(appointment) {
        return supabase.from('appointments').insert(appointment).select().single();
    },

    async updateStatus(id, status, notes) {
        return supabase.from('appointments')
            .update({ status, notes })
            .eq('id', id);
    }
};`
            },
            {
                title: "DashboardRepository",
                code: `// src/features/dashboard/api/dashboard.repository.js

export const DashboardRepository = {
    async fetchKPIs() {
        const { data } = await supabase.rpc('get_dashboard_kpis');
        return data;
    },

    async fetchByDependency() {
        const { data } = await supabase
            .from('appointments')
            .select('dependency_id, dependencies(name, color), status');
        // Procesar datos...
        return processed;
    },

    async fetchProfessionals() {
        const { data } = await supabase
            .from('appointments')
            .select('professional_id, profiles(full_name), status');
        // Contar atenciones por profesional...
        return ranked;
    }
};`
            }
        ]
    },
    {
        id: "hooks",
        icon: Code,
        title: "Custom Hooks",
        content: "Los hooks personalizados abstraen la logica de negocio de los componentes.",
        subsections: [
            {
                title: "useAppointments",
                code: `// src/features/appointments/components/hooks/UseAppointments.js

export function useAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAppointments = useCallback(async (filters) => {
        setIsLoading(true);
        const { data } = await AppointmentRepository
            .fetchByUser(user.id, filters);
        setAppointments(data || []);
        setIsLoading(false);
    }, [user]);

    const updateStatus = useCallback(async (id, status, notes) => {
        await AppointmentRepository.updateStatus(id, status, notes);
        fetchAppointments();
    }, []);

    return { appointments, fetchAppointments, updateStatus, isLoading };
}`
            }
        ]
    },
    {
        id: "realtime",
        icon: Globe,
        title: "Notificaciones en Tiempo Real",
        content: "Supabase Realtime se usa para notificaciones push via postgres_changes.",
        subsections: [
            {
                title: "Configuracion",
                code: `// NotificationContext.jsx
const channel = supabase
    .channel('notifications-changes')
    .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: \`user_id=eq.\${user.id}\`
    }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
    })
    .subscribe();`
            }
        ]
    },
    {
        id: "setup",
        icon: Terminal,
        title: "Instalacion y Configuracion",
        subsections: [
            {
                title: "Requisitos Previos",
                items: [
                    { label: "Node.js", value: "v18+ (recomendado v20)" },
                    { label: "npm", value: "v9+" },
                    { label: "Cuenta Supabase", value: "Proyecto activo con DB y Auth" }
                ]
            },
            {
                title: "Pasos de Instalacion",
                code: `# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/gestion_citas.git
cd gestion_citas

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Crear archivo .env en la raiz:
echo "VITE_SUPABASE_URL=tu_url" > .env
echo "VITE_SUPABASE_ANON_KEY=tu_key" >> .env

# 4. Ejecutar en desarrollo
npm run dev

# 5. Build para produccion
npm run build

# 6. Ejecutar lint
npm run lint`
            },
            {
                title: "Variables de Entorno",
                code: `# .env (requerido)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Opcionales
VITE_APP_TITLE=SENA Bienestar`
            }
        ]
    },
    {
        id: "deploy",
        icon: GitBranch,
        title: "Despliegue",
        subsections: [
            {
                title: "Produccion",
                code: `# Build optimizado
npm run build

# El output estara en dist/
# Subir dist/ a tu hosting (Vercel, Netlify, etc.)

# Para Vercel:
npx vercel --prod

# Para Netlify:
npx netlify deploy --prod --dir=dist`
            },
            {
                title: "Configuracion Supabase",
                items: [
                    { label: "RLS", value: "Habilitar Row Level Security en todas las tablas" },
                    { label: "CORS", value: "Agregar tu dominio de produccion en Supabase Dashboard > Settings > API" },
                    { label: "Policies", value: "Crear policies de lectura/escritura segun el rol" }
                ]
            }
        ]
    },
    {
        id: "troubleshooting",
        icon: Settings,
        title: "Solucion de Problemas",
        items: [
            { title: "Error de conexion a Supabase", description: "Verifica que VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY esten correctos en .env" },
            { title: "CORS error", description: "Agrega tu dominio en Supabase Dashboard > Settings > API > CORS" },
            { title: "Login no redirige", description: "Verifica que el rol del usuario exista en la tabla profiles" },
            { title: "Build falla", description: "Ejecuta 'npm run lint' para ver errores de codigo" },
            { title: "CSS no carga", description: "Verifica que los imports en global.css sean correctos" }
        ]
    }
];

export default function TechnicalManual() {
    return (
        <div className="manual-page">
            <div className="manual-container">
                <div className="manual-header">
                    <Link to="/" className="manual-back"><ArrowLeft size={18} /> Volver al sistema</Link>
                    <div className="manual-header-content">
                        <div className="manual-icon manual-icon-blue"><Code size={32} /></div>
                        <h1>Manual Tecnico</h1>
                        <p>Documentacion tecnica del Sistema de Bienestar SENA</p>
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
                    </ul>
                </nav>

                {SECTIONS.map((section) => (
                    <section key={section.id} id={section.id} className="manual-section">
                        <div className="manual-section-header">
                            <section.icon size={22} />
                            <h2>{section.title}</h2>
                        </div>

                        {section.content && <p className="manual-text">{section.content}</p>}

                        {section.subsections && section.subsections.map((sub, i) => (
                            <div key={i} className="manual-subsection">
                                <h3>{sub.title}</h3>

                                {sub.items && (
                                    <div className="manual-items">
                                        {sub.items.map((item, j) => (
                                            <div key={j} className="manual-item manual-item-row">
                                                <span className="manual-item-label">{item.label}</span>
                                                <span className="manual-item-value">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {sub.steps && (
                                    <div className="manual-steps">
                                        {sub.steps.map((step, j) => (
                                            <div key={j} className="manual-step">
                                                <div className="manual-step-number">{j + 1}</div>
                                                <div className="manual-step-content">
                                                    <p>{step}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {sub.code && (
                                    <div className="manual-code">
                                        <pre><code>{sub.code}</code></pre>
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

                <div className="manual-footer">
                    <p>Manual Tecnico - Sistema de Bienestar SENA</p>
                    <p>Version 1.0 - Julio 2026</p>
                </div>
            </div>
        </div>
    );
}
