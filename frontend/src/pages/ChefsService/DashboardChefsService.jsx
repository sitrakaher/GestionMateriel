import React, { useState, useEffect, useCallback } from "react";
import { getDemandes, updateDemandeStatus, addNotification } from "../../api/api";
import { useNotifications } from "../../context/notificationContext";
import { useAuth } from "../../context/authContext";
import { NavBar } from "../../components/navBar";

export default function DashboardChefService() {
  const { user } = useAuth();
  const { notifications } = useNotifications();

  // ✅ FIX : utiliser user.service (string retourné par UserOut)
  const serviceName = user?.service || "";

  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuContextuel, setMenuContextuel] = useState({
    visible: false,
    x: 0,
    y: 0,
    demandeId: null,
    demande: null,
  });
  const [toasts, setToasts] = useState([]);
  const [motifRejet, setMotifRejet] = useState("");
  const [showMotif, setShowMotif] = useState(false);

  const showToast = (message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  // ✅ FIX : filtre sur serviceName (nom du service du chef)
  const fetchDemandes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDemandes(serviceName);
      // ✅ FIX : afficher seulement les demandes EN_ATTENTE_CHEF
      const enAttente = Array.isArray(data)
        ? data.filter((d) => d.status === "en_attente_chef")
        : [];
      setDemandes(enAttente);
    } catch (err) {
      console.error("Erreur fetchDemandes:", err);
    } finally {
      setLoading(false);
    }
  }, [serviceName]);

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
  const handleContextMenu = (event, demande) => {
    event.preventDefault();
    setMenuContextuel({
      visible: true,
      x: event.pageX,
      y: event.pageY,
      demandeId: demande.id,
      demande,
    });
    setShowMotif(false);
    setMotifRejet("");
  };

  const fermerMenu = () => {
    setMenuContextuel((prev) => ({ ...prev, visible: false }));
    setShowMotif(false);
    setMotifRejet("");
  };

  useEffect(() => {
    document.addEventListener("click", fermerMenu);
    return () => document.removeEventListener("click", fermerMenu);
  }, []);

  // ✅ FIX : envoyer les bons statuts + notifications
  const gererDemande = async (statut) => {
    const { demandeId, demande } = menuContextuel;
    try {
      // ✅ FIX : chef approuve → EN_ATTENTE_DIRECTEUR (pas "approuve" directement)
      const nouveauStatut =
        statut === "approuve" ? "en_attente_directeur" : "rejetee_chef";

      await updateDemandeStatus(demandeId, nouveauStatut, motifRejet || null);

      // ✅ Notification au demandeur
      const demandeurId = demande?.demandeur?.id;
      const ligne = demande?.lignes?.[0];
      const materielNom = ligne?.materiel_nom || "matériel";

      if (demandeurId) {
        if (statut === "approuve") {
          await addNotification(
            demandeurId,
            `✅ Votre demande #${demandeId} (${materielNom}) a été approuvée par le chef de service et transmise au directeur.`
          );
        } else {
          await addNotification(
            demandeurId,
            `❌ Votre demande #${demandeId} (${materielNom}) a été rejetée par le chef de service.${motifRejet ? ` Motif : ${motifRejet}` : ""}`
          );
        }
      }

      showToast(
        statut === "approuve"
          ? "✅ Demande transmise au directeur"
          : "❌ Demande rejetée"
      );
      fetchDemandes();
      fermerMenu();
    } catch (err) {
      console.error("Erreur gererDemande:", err);
    }
  };

  // ✅ Couleurs selon vrais statuts
  const getStatusColor = (status) => {
    switch (status) {
      case "en_attente_chef": return "bg-yellow-500";
      case "en_attente_directeur": return "bg-blue-500";
      case "approuve": return "bg-green-600";
      case "rejetee_chef":
      case "rejetee_directeur": return "bg-red-600";
      case "annulee": return "bg-gray-400";
      case "livree": return "bg-blue-700";
      default: return "bg-gray-500";
    }
  };

  return (
    <div>
      <NavBar titre="Tableau de Bord Chef de Service" />
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
                demandes.map((demande) => {
                  // ✅ FIX : lire depuis lignes[0]
                  const ligne = demande.lignes?.[0];
                  return (
                    <tr
                      key={demande.id}
                      className="hover:bg-gray-100 cursor-pointer"
                      onContextMenu={(e) => handleContextMenu(e, demande)}
                    >
                      <td className="p-2 border">{demande.id}</td>
                      <td className="p-2 border">
                        {demande.demandeur?.email || "-"}
                      </td>
                      <td className="p-2 border">{ligne?.materiel_nature ?? "-"}</td>
                      <td className="p-2 border">{ligne?.materiel_nom ?? "-"}</td>
                      <td className="p-2 border">{ligne?.quantite ?? "-"}</td>
                      <td className="p-2 border">
                        {demande.date_demande
                          ? new Date(demande.date_demande).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="p-2 border">
                        <span className={`px-2 py-1 rounded text-white ${getStatusColor(demande.status)}`}>
                          {demande.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center p-4 text-gray-500">
                    Aucune demande en attente
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Menu contextuel */}
        {menuContextuel.visible && (
          <div
            className="absolute bg-white border rounded shadow-lg z-50 p-2 min-w-48"
            style={{ top: menuContextuel.y, left: menuContextuel.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => gererDemande("approuve")}
              className="block w-full px-4 py-2 hover:bg-green-100 text-left"
            >
              ✅ Approuver → Directeur
            </button>
            <div className="border-t mt-1 pt-1">
              {!showMotif ? (
                <button
                  onClick={() => setShowMotif(true)}
                  className="block w-full px-4 py-2 hover:bg-red-100 text-left"
                >
                  ❌ Rejeter
                </button>
              ) : (
                <div className="px-2 py-1">
                  <textarea
                    value={motifRejet}
                    onChange={(e) => setMotifRejet(e.target.value)}
                    placeholder="Motif du rejet (optionnel)"
                    className="w-full border rounded p-1 text-sm mb-1"
                    rows={2}
                  />
                  <button
                    onClick={() => gererDemande("rejete")}
                    className="w-full bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                  >
                    Confirmer le rejet
                  </button>
                </div>
              )}
            </div>
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
