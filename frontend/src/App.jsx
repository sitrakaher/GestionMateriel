// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/authContext";

// Pages Auth

// Dashboards
import DashboardDirecteur from "./pages/Directeur/DashboardDirecteur";
import DashboardDemandeur from "./pages/Demandeur/DashboardDemandeur";
import Magasinier from "./pages/Magasinier/magasinier";
import DashboardChefService from "./pages/ChefsService/DashboardChefsService";
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import Inscription from "./pages/Authentification/inscription";
import ForgotPassword from "./pages/Authentification/MotDePasse/ForgotPassword";
import Connexion from "./pages/Authentification/connexion";

// Composant pour protéger les routes selon le rôle
function PrivateRoute({ children, roles }) {
  const { token, user } = useAuth();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Redirection selon rôle par défaut
    switch (user.role) {
      case "Admin":
        return <Navigate to="/dashboard-admin" replace />;
      case "Directeur":
        return <Navigate to="/dashboard-directeur" replace />;
      case "Chef de service":
        return <Navigate to={`/dashboard/chef/${user.service_name?.toLowerCase()}`} replace />;
      case "Demandeur":
        return <Navigate to={`/dashboard/demandeur/${user.service_name?.toLowerCase()}`} replace />;
      case "Magasinier":
        return <Navigate to="/dashboard-magasinier" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Pages publiques */}
          <Route path="/" element={<Connexion />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Dashboards protégés */}
          <Route
            path="/dashboard-admin"
            element={
              <PrivateRoute roles={["Admin"]}>
                <DashboardAdmin />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard-directeur"
            element={
              <PrivateRoute roles={["Directeur"]}>
                <DashboardDirecteur />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard-magasinier/*"
            element={
              <PrivateRoute roles={["Magasinier"]}>
                <Magasinier />
              </PrivateRoute>
            }
          />

          {/* Routes dynamiques par service */}
          <Route
            path="/dashboard/chef/:service"
            element={
              <PrivateRoute roles={["Chef de service"]}>
                <DashboardChefService />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/demandeur/:service"
            element={
              <PrivateRoute roles={["Demandeur"]}>
                <DashboardDemandeur />
              </PrivateRoute>
            }
          />

          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
