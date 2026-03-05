import React, { useState } from "react";
import GestionUtilisateurs from "../admin/GestionUtilisateurs";
import GestionServices from "../admin/GestionServices";
import LogoutButton from "../../components/deconnexion";

export default function DashboardAdmin() {
  const [activeSection, setActiveSection] = useState("utilisateurs"); // Par défaut

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
    <aside className="w-64 bg-orange-500 shadow p-4">
        <h1 className="text-2xl text-white font-bold mb-6">Admin Dashboard</h1>
        <nav className="space-y-2">
          <div>

          <button
            className={`w-full font-bold text-left px-4 py-2 rounded ${
              activeSection === "utilisateurs" ? "bg-white font-bold" : ""
            }`}
            onClick={() => setActiveSection("utilisateurs")}
          >
            👥 Gestion Utilisateurs
          </button>
          <button
            className={`w-full font-bold text-left px-4 py-2 rounded hover:bg-gray-200 ${
              activeSection === "services" ? "bg-white font-bold" : ""
            }`}
            onClick={() => setActiveSection("services")}
          >
            🏢 Gestion Services
          </button>
          </div>
          <div className="bottom-1">

          <LogoutButton/>
          </div>
        </nav>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 p-6">
        {activeSection === "utilisateurs" && <GestionUtilisateurs />}
        {activeSection === "services" && <GestionServices />}
      </main>
    </div>
  );
}
