import React, { useState, useEffect, useCallback } from "react";
import { getDemandes, updateDemandeStatus } from "../../api/api";
import { useNotifications } from "../../context/notificationContext";
import { useAuth } from "../../context/authContext";
import { NavBar } from "../../components/navBar";

export default function DashboardChefService() {
  const { user } = useAuth();
  const { notifications } = useNotifications();

  const service = user?.service_name || user?.service || "Informatique";

  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuContextuel, setMenuContextuel] = useState({
    visible: false,
    x: 0,
    y: 0,
    demandeId: null,
  });
  const [toasts, setToasts] = useState([]);

  const showToast = (message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  // 🔹 Récupérer les demandes de son service
  const fetchDemandes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDemandes(service);
      setDemandes(data);
    } catch (err) {
      console.error("Erreur fetchDemandes:", err);
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    fetchDemandes();
  }, [fetchDemandes]);

  // 🔹 Notifications backend
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const lastNotif = notifications[notifications.length - 1];
      showToast(lastNotif.message);
    }
  }, [notifications]);

  // 🔹 Menu contextuel
  const handleContextMenu = (event, demandeId) => {
    event.preventDefault();
    setMenuContextuel({
      visible: true,
      x: event.pageX,
      y: event.pageY,
      demandeId,
    });
  };

  const fermerMenu = () => setMenuContextuel({ ...menuContextuel, visible: false });

  useEffect(() => {
    document.addEventListener("click", fermerMenu);
    return () => document.removeEventListener("click", fermerMenu);
  }, []);

  // 🔹 Approuver ou rejeter
  const gererDemande = async (statut) => {
    try {
      await updateDemandeStatus(menuContextuel.demandeId, statut);
      showToast(`Demande ${statut === "approuve" ? "approuvée ✅" : "rejetée ❌"}`);
      fetchDemandes();
      fermerMenu();
    } catch (err) {
      console.error("Erreur gererDemande:", err);
    }
  };

  return (
    <div>
      
      <NavBar titre="Tableau de Bord Chef de Service"/>
    <div className="p-6 relative">

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Demandeur</th>
              <th className="p-2 border">Nature</th>
              <th className="p-2 border">Matériel</th>
              <th className="p-2 border">Quantité</th>
              <th className="p-2 border">Date Demande</th>
              <th className="p-2 border">Statut</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="p-4 text-gray-500 text-center">
                  Chargement des demandes...
                </td>
              </tr>
            ) : demandes.length > 0 ? (
              demandes.map((demande) => (
                <tr
                  key={demande.id}
                  className="hover:bg-gray-100 cursor-pointer"
                  onContextMenu={(e) => handleContextMenu(e, demande.id)}
                >
                  <td className="p-2 border">{demande.id}</td>
                  <td className="p-2 border">{demande.demandeur}</td>
                  <td className="p-2 border">{demande.nature}</td>
                  <td className="p-2 border">{demande.materiel}</td>
                  <td className="p-2 border">{demande.quantite}</td>
                  <td className="p-2 border">{demande.date_demande}</td>
                  <td className="p-2 border">
                    <span
                      className={`px-2 py-1 rounded text-white ${
                        demande.status === "approuve"
                          ? "bg-green-600"
                          : demande.status === "rejete"
                          ? "bg-red-600"
                          : "bg-gray-500"
                      }`}
                    >
                      {demande.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center p-4 text-gray-500">
                  Aucune demande trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Menu contextuel */}
      {menuContextuel.visible && (
        <div
          className="absolute bg-white border rounded shadow-lg z-50"
          style={{ top: menuContextuel.y, left: menuContextuel.x }}
        >
          <button
            onClick={() => gererDemande("approuve")}
            className="block w-full px-4 py-2 hover:bg-green-100 text-left"
          >
            ✅ Approuver
          </button>
          <button
            onClick={() => gererDemande("rejete")}
            className="block w-full px-4 py-2 hover:bg-red-100 text-left"
          >
            ❌ Rejeter
          </button>
        </div>
      )}

      {/* 🔔 Toasts */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-gray-800 text-white px-4 py-2 rounded shadow-lg animate-fade-in"
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}
