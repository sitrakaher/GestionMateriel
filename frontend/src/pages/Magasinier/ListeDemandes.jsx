import React, { useState, useEffect } from "react";
import { addNotification, getDemandes, updateLivraison } from "../../api/api";
import { NavBar } from "../../components/navBar";

export default function ListeDemandes() {
  const [demandes, setDemandes] = useState([]);
  const [menuContextuel, setMenuContextuel] = useState({
    visible: false, x: 0, y: 0, demandeId: null, demande: null,
  });
  const [partielQty, setPartielQty] = useState("");
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    fetchDemandes();
  }, []);

  const fetchDemandes = async () => {
    setLoading(true);
    try {
      const data = await getDemandes();
      // ✅ FIX : magasinier voit les demandes "approuve" (approuvées par directeur)
      // + "livree_partiel" pour pouvoir compléter la livraison
      const aLivrer = Array.isArray(data)
        ? data.filter((d) => d.status === "approuve" || d.status === "livree_partiel")
        : [];
      setDemandes(aLivrer);
    } catch (err) {
      console.error("Erreur fetchDemandes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleContextMenu = (e, demande) => {
    e.preventDefault();
    setMenuContextuel({ visible: true, x: e.pageX, y: e.pageY, demandeId: demande.id, demande });
    setPartielQty("");
  };

  const fermerMenu = () => setMenuContextuel((prev) => ({ ...prev, visible: false }));

  useEffect(() => {
    document.addEventListener("click", fermerMenu);
    return () => document.removeEventListener("click", fermerMenu);
  }, []);

  const showToast = (message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const handleLivraison = async (type) => {
    const { demandeId, demande } = menuContextuel;
    try {
      if (!demande) return;

      // ✅ FIX : mapper "total" → "complet" attendu par le backend
      const typeBackend = type === "total" ? "complet" : type;

      let messageNotif = "";

      if (type === "partiel") {
        if (!partielQty || Number(partielQty) <= 0) {
          alert("Quantité valide requise");
          return;
        }
        await updateLivraison(demandeId, "partiel", Number(partielQty));
        messageNotif = `🟡 Votre demande #${demandeId} a été livrée partiellement (${partielQty} unités).`;
        showToast(`🟡 Livraison partielle : ${partielQty}`);
      } else if (type === "total") {
        await updateLivraison(demandeId, "complet"); // ✅ "complet" pas "total"
        messageNotif = `✅ Votre demande #${demandeId} a été totalement livrée.`;
        showToast("✅ Livraison totale effectuée");
      } else {
        // épuisé : on marque la demande comme épuisée via le status
        await updateLivraison(demandeId, "epuise");
        messageNotif = `❌ Votre demande #${demandeId} n'a pas pu être livrée (stock épuisé).`;
        showToast("❌ Stock épuisé pour cette demande");
      }

      // ✅ FIX : utiliser demande.demandeur.id (objet imbriqué dans DemandeOut)
      const demandeurId = demande?.demandeur?.id;
      if (demandeurId && messageNotif) {
        await addNotification(demandeurId, messageNotif);
      }

      setPartielQty("");
      fermerMenu();
      fetchDemandes();
    } catch (err) {
      console.error("Erreur livraison:", err);
      showToast("⚠️ Erreur lors de la livraison");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approuve": return "bg-green-600";
      case "livree_partiel": return "bg-yellow-600";
      case "livree": return "bg-blue-700";
      case "epuise": return "bg-red-700";
      default: return "bg-gray-500";
    }
  };

  return (
    <div>
      <NavBar titre="Tableau de Bord Magasinier" />
      <div className="p-6 relative">

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 border">ID</th>
                <th className="p-2 border">Demandeur</th>
                <th className="p-2 border">Service</th>
                <th className="p-2 border">Nature</th>
                <th className="p-2 border">Matériel(s)</th>
                <th className="p-2 border">Qté demandée</th>
                <th className="p-2 border">Déjà livré</th>
                <th className="p-2 border">Date demande</th>
                <th className="p-2 border">Date livraison</th>
                <th className="p-2 border">Statut</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center p-4 text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : demandes.length > 0 ? (
                demandes.map((d) => {
                  // ✅ FIX : lire depuis lignes[] correctement
                  const totalQte = d.lignes?.reduce((s, l) => s + (l.quantite || 0), 0) ?? "-";
                  const totalLivre = d.lignes?.reduce((s, l) => s + (l.quantite_livree || 0), 0) ?? 0;
                  const ligne = d.lignes?.[0];

                  return (
                    <tr
                      key={d.id}
                      className="hover:bg-gray-100 cursor-pointer"
                      onContextMenu={(e) => handleContextMenu(e, d)}
                    >
                      <td className="p-2 border">{d.id}</td>
                      <td className="p-2 border">{d.demandeur?.email || "-"}</td>
                      <td className="p-2 border">{d.service?.nom ?? "-"}</td>
                      <td className="p-2 border">
                        {/* ✅ FIX : materiel_nature depuis LigneDemandeOut */}
                        {d.lignes?.map((l) => l.materiel_nature || "-").join(", ")}
                      </td>
                      <td className="p-2 border">
                        {/* ✅ FIX : materiel_nom depuis LigneDemandeOut */}
                        {d.lignes?.map((l) => `${l.materiel_nom || l.materiel_id} x${l.quantite}`).join(", ")}
                      </td>
                      <td className="p-2 border">{totalQte}</td>
                      <td className="p-2 border">{totalLivre}</td>
                      <td className="p-2 border">
                        {d.date_demande ? new Date(d.date_demande).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-2 border">
                        {d.date_livraison ? new Date(d.date_livraison).toLocaleDateString() : "-"}
                      </td>
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
                  <td colSpan="10" className="text-center p-4 text-gray-500">
                    Aucune demande à livrer
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Menu contextuel */}
        {menuContextuel.visible && (
          <div
            className="absolute bg-white border rounded shadow-lg z-50 p-2"
            style={{ top: menuContextuel.y, left: menuContextuel.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleLivraison("total")}
              className="block w-full px-4 py-2 hover:bg-green-100 text-left"
            >
              ✅ Livré total
            </button>
            <div className="block w-full px-4 py-2 border-t">
              <button
                onClick={() => handleLivraison("partiel")}
                className="w-full text-left hover:bg-yellow-100 mb-1"
              >
                🟡 Livré partiel
              </button>
              <input
                type="number"
                value={partielQty}
                onChange={(e) => setPartielQty(e.target.value)}
                placeholder="Quantité"
                className="w-full mt-1 p-1 border rounded text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <button
              onClick={() => handleLivraison("epuise")}
              className="block w-full px-4 py-2 hover:bg-red-100 text-left border-t"
            >
              ❌ Épuisé
            </button>
          </div>
        )}

        {/* Toast notifications */}
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
