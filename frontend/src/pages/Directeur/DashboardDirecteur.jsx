import React, { useState, useEffect, useCallback } from "react";
import { getDemandes, updateDemandeStatus, addNotification } from "../../api/api";
import { NavBar } from "../../components/navBar";
import { useNotifications } from "../../context/notificationContext";

export default function DashboardDirecteur() {
  const { notifications } = useNotifications();

  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(false);
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

  // ✅ Directeur voit TOUTES les demandes en_attente_directeur (tous services)
  const fetchDemandes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDemandes(); // pas de filtre service
      const enAttente = Array.isArray(data)
        ? data.filter((d) => d.status === "en_attente_directeur")
        : [];
      setDemandes(enAttente);
    } catch (err) {
      console.error("Erreur fetchDemandes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

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
  const handleContextMenu = (e, demande) => {
    e.preventDefault();
    setMenuContextuel({ visible: true, x: e.pageX, y: e.pageY, demandeId: demande.id, demande });
    setShowMotif(false);
    setMotifRejet("");
  };

  const fermerMenu = () => {
    setMenuContextuel((m) => ({ ...m, visible: false }));
    setShowMotif(false);
    setMotifRejet("");
  };

  useEffect(() => {
    document.addEventListener("click", fermerMenu);
    return () => document.removeEventListener("click", fermerMenu);
  }, []);

  // ✅ FIX : directeur approuve → statut "approuve" (final) + notif demandeur + notif magasinier
  const gererDemande = async (statut) => {
    const { demandeId, demande } = menuContextuel;
    try {
      const nouveauStatut = statut === "approuve" ? "approuve" : "rejetee_directeur";
      await updateDemandeStatus(demandeId, nouveauStatut, motifRejet || null);

      const demandeurId = demande?.demandeur?.id;
      const ligne = demande?.lignes?.[0];
      const materielNom = ligne?.materiel_nom || "matériel";
      const serviceNom = demande?.service?.nom || "votre service";

      // ✅ Notification au demandeur
      if (demandeurId) {
        if (statut === "approuve") {
          await addNotification(
            demandeurId,
            `✅ Votre demande #${demandeId} (${materielNom}) a été approuvée par le directeur. La livraison est en cours de préparation.`
          );
        } else {
          await addNotification(
            demandeurId,
            `❌ Votre demande #${demandeId} (${materielNom}) a été rejetée par le directeur.${motifRejet ? ` Motif : ${motifRejet}` : ""}`
          );
        }
      }

      showToast(
        statut === "approuve"
          ? `✅ Demande approuvée — transmise au magasinier`
          : "❌ Demande rejetée par le directeur"
      );

      fetchDemandes();
      fermerMenu();
    } catch (err) {
      console.error("Erreur gererDemande:", err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "en_attente_directeur": return "bg-blue-500";
      case "approuve": return "bg-green-600";
      case "rejetee_chef":
      case "rejetee_directeur": return "bg-red-600";
      case "annulee": return "bg-gray-400";
      case "livree": return "bg-blue-700";
      case "livree_partiel": return "bg-yellow-600";
      default: return "bg-gray-500";
    }
  };

  return (
    <div>
      <NavBar titre="Tableau de Bord Directeur" />
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
                <th className="p-2 border">Service</th>
                <th className="p-2 border">Statut</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-4 text-gray-500 text-center">
                    Chargement des demandes...
                  </td>
                </tr>
              ) : demandes.length > 0 ? (
                demandes.map((d) => {
                  // ✅ FIX : lire depuis lignes[0]
                  const ligne = d.lignes?.[0];
                  return (
                    <tr
                      key={d.id}
                      className="hover:bg-gray-100 cursor-pointer"
                      onContextMenu={(e) => handleContextMenu(e, d)}
                    >
                      <td className="p-2 border">{d.id}</td>
                      <td className="p-2 border">{d.demandeur?.email || "-"}</td>
                      <td className="p-2 border">{ligne?.materiel_nature ?? "-"}</td>
                      <td className="p-2 border">{ligne?.materiel_nom ?? "-"}</td>
                      <td className="p-2 border">{ligne?.quantite ?? "-"}</td>
                      <td className="p-2 border">
                        {d.date_demande ? new Date(d.date_demande).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-2 border">{d.service?.nom ?? "-"}</td>
                      <td className="p-2 border">
                        <span className={`px-2 py-1 rounded text-white ${getStatusColor(d.status)}`}>
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center p-4 text-gray-500">
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
              ✅ Approuver → Magasinier
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
