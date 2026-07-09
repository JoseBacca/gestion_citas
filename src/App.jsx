import { AppRoutes } from "./routes/AppRoutes";
import Sidebar from "./shared/components/Sidebar";
import { useAuth } from "./providers/Authproviders";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "var(--bg)"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "var(--radius-lg)",
            background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 800,
            fontSize: "1rem",
            margin: "0 auto 1rem"
          }}>SB</div>
          <p style={{ color: "var(--gray-500)", fontSize: "var(--text-sm)" }}>Cargando sesion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {user && <Sidebar />}
      <main className={user ? "app-main" : ""}>
        <div className="app-content">
          <AppRoutes />
        </div>
      </main>
    </div>
  );
}

export default App;
