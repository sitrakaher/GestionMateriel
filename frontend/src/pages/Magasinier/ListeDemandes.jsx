import React, { useState, useEffect } from "react"; // 🔹 j'ajoute addNotification
import { addNotification, getDemandes, updateLivraison } from "../../api/api";

export default function ListeDemandes() {
  const [demandes, setDemandes] = useState([]);
  const [menuContextuel, setMenuContextuel] = useState({ visible: false, x: 0, y: 0, demandeId: null });
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
      setDemandes((data || []).filter(d => d.status === "approuve"));
    } catch (err) {
      console.error("Erreur fetchDemandes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleContextMenu = (e, id) => {
    e.preventDefault();
    setMenuContextuel({ visible: true, x: e.pageX, y: e.pageY, demandeId: id });
  };

  const fermerMenu = () => setMenuContextuel({ ...menuContextuel, visible: false });

  useEffect(() => {
    document.addEventListener("click", fermerMenu);
    return () => document.removeEventListener("click", fermerMenu);
  }, []);

  const showToast = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleLivraison = async (type) => {
    try {
      const demande = demandes.find(d => d.id === menuContextuel.demandeId);
      if (!demande) return;

      let messageNotif = "";

      if (type === "partiel") {
        if (!partielQty || Number(partielQty) <= 0) {
          alert("Quantité valide requise");
          return;
        }
        await updateLivraison(demande.id, "partiel", Number(partielQty));
        messageNotif = `Votre demande #${demande.id} a été livrée partiellement (${partielQty} unités).`;
        showToast(`🟡 Livraison partielle : ${partielQty}`);
      } else if (type === "total") {
        await updateLivraison(demande.id, "total");
        messageNotif = `Votre demande #${demande.id} a été totalement livrée ✅.`;
        showToast("✅ Livraison totale effectuée");
      } else {
        await updateLivraison(demande.id, "epuise");
        messageNotif = `Votre demande #${demande.id} n’a pas pu être livrée (stock épuisé) ❌.`;
        showToast("❌ Stock épuisé pour cette demande");
      }

      // 🔹 Envoi notification au demandeur (si dispo)
      if (demande.demandeur?.id) {
        await addNotification(demande.demandeur.id, messageNotif);
      }

      setPartielQty("");
      fermerMenu();
      fetchDemandes();
    } catch (err) {
      console.error("Erreur livraison:", err);
    }
  };

  return (
    <div className="p-6 relative">
      <h1 className="text-2xl font-bold mb-4">📦 Liste des demandes approuvées</h1>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Demandeur</th>
              <th className="p-2 border">Nature</th>
              <th className="p-2 border">Matériel(s)</th>
              <th className="p-2 border">Quantité demandée</th>
              <th className="p-2 border">Déjà livré</th>
              <th className="p-2 border">Date demande</th>
              <th className="p-2 border">Date livraison</th>
              <th className="p-2 border">Statut</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center p-4 text-gray-500">Chargement...</td>
              </tr>
            ) : demandes.length > 0 ? (
              demandes.map(d => (
                <tr
                  key={d.id}
                  className="hover:bg-gray-100 cursor-pointer"
                  onContextMenu={e => handleContextMenu(e, d.id)}
                >
                  <td className="p-2 border">{d.id}</td>
                  <td className="p-2 border">{d.demandeur?.email || "-"}</td>
                  <td className="p-2 border">
                    {d.lignes?.map(l => l.materiel?.nature || "-").join(", ")}
                  </td>
                  <td className="p-2 border">
                    {d.lignes?.map(l => `${l.materiel?.nom || l.materiel_id} x${l.quantite}`).join(", ")}
                  </td>
                  <td className="p-2 border">{d.lignes?.reduce((s, l) => s + (l.quantite || 0), 0)}</td>
                  <td className="p-2 border">{d.lignes?.reduce((s, l) => s + (l.nombre_livre || 0), 0)}</td>
                  <td className="p-2 border">{d.date_demande}</td>
                  <td className="p-2 border">{d.date_livraison || "-"}</td>
                  <td className="p-2 border">{d.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center p-4 text-gray-500">Aucune demande approuvée</td>
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
          <button onClick={() => handleLivraison("total")} className="block w-full px-4 py-2 hover:bg-green-100 text-left">
            ✅ Livré total
          </button>
          <div className="block w-full px-4 py-2">
            <button onClick={() => handleLivraison("partiel")} className="w-full text-left hover:bg-yellow-100">
              🟡 Livré partiel
            </button>
            <input
              type="number"
              value={partielQty}
              onChange={e => setPartielQty(e.target.value)}
              placeholder="Quantité"
              className="w-full mt-1 p-1 border rounded"
            />
          </div>
          <button onClick={() => handleLivraison("epuise")} className="block w-full px-4 py-2 hover:bg-red-100 text-left">
            ❌ Épuisé
          </button>
        </div>
      )}

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(t => (
          <div key={t.id} className="bg-gray-800 text-white px-4 py-2 rounded shadow-lg animate-fade-in">
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
