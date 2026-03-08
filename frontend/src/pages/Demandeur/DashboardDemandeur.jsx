import { useEffect, useState, useCallback, useMemo } from "react";
import {
  createDemande,
  getDemandes,
  getMateriels,
  updateDemandeStatus,
  updateDemande,
  addMateriel,
} from "../../api/api";
import { NavBar } from "../../components/navBar";
import { useNotifications } from "../../context/notificationContext";
import { useAuth } from "../../context/authContext";

export default function DashboardDemandeur() {
  const { user } = useAuth();
  const { notifications } = useNotifications();

  // ✅ Mémorisé — ne change pas à chaque render
  const serviceName = useMemo(() => user?.service || "", [user?.service]);
  const serviceId = useMemo(() => user?.service_id || null, [user?.service_id]);

  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [materielsDisponibles, setMaterielsDisponibles] = useState([]);
  const [natureSelectionnee, setNatureSelectionnee] = useState("");
  const [materielSelectionne, setMaterielSelectionne] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [modeEdition, setModeEdition] = useState(false);
  const [demandeEnEdition, setDemandeEnEdition] = useState(null);
  const [nouvelleNature, setNouvelleNature] = useState("");

  const [menuContextuel, setMenuContextuel] = useState({
    visible: false, x: 0, y: 0, demandeId: null, status: null,
  });
  const [toasts, setToasts] = useState([]);

  const showToast = (message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  // ✅ Aucune boucle — dépend uniquement de serviceName (stable)
  const fetchDemandes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDemandes(serviceName);
      setDemandes(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [serviceName]);

  // ✅ Aucune boucle — tableau vide, initialisations via setX(prev => ...)
  const fetchMateriels = useCallback(async () => {
    const data = await getMateriels();
    if (Array.isArray(data) && data.length > 0) {
      setMaterielsDisponibles(data);
      const premiereNature = data[0].nature;
      setNatureSelectionnee((prev) => prev || premiereNature);
      const premierMateriel = data.find(
        (m) => m.nature === premiereNature && m.quantite > 0
      );
      if (premierMateriel) {
        setMaterielSelectionne((prev) => prev || premierMateriel.nom);
      }
    }
  }, []); // ✅ aucune dépendance externe

  useEffect(() => { fetchDemandes(); }, [fetchDemandes]);
  useEffect(() => { fetchMateriels(); }, [fetchMateriels]);

  // ✅ fermerMenu stable — pas de stale closure
  useEffect(() => {
    const handler = () => setMenuContextuel((prev) => ({ ...prev, visible: false }));
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const handleSubmitDemande = async () => {
    if (!materielSelectionne || quantite < 1) return;

    // ✅ Vérification service_id présent
    if (!serviceId) {
      showToast("⚠️ Service introuvable, contactez l'administrateur.");
      return;
    }

    let natureFinale = natureSelectionnee;
    if (natureSelectionnee === "nouvelle") {
      if (!nouvelleNature) {
        alert("Veuillez saisir la nouvelle nature.");
        return;
      }
      natureFinale = nouvelleNature;
      const nouveauMateriel = await addMateriel({
        nom: materielSelectionne,
        nature: natureFinale,
        prix: 0,
        quantite: 0,
      });
      if (!nouveauMateriel) return;
      await fetchMateriels();
    }

    if (modeEdition && demandeEnEdition) {
      await updateDemande(demandeEnEdition.id, {
        lignes: [{ materiel: materielSelectionne, quantite, nature: natureFinale }],
      });
      setModeEdition(false);
      setDemandeEnEdition(null);
      showToast("✅ Demande modifiée avec succès !");
    } else {
      const lignes = [{ materiel: materielSelectionne, quantite, nature: natureFinale }];
      const result = await createDemande(user.id, serviceId, lignes);
      if (result?.error) {
        showToast(`⚠️ Erreur : ${result.error}`);
        return;
      }
      showToast("📨 Demande envoyée au chef de service !");
    }

    setQuantite(1);
    await fetchDemandes();
  };

  const handleContextMenu = (e, demandeId, status) => {
    e.preventDefault();
    setMenuContextuel({ visible: true, x: e.pageX, y: e.pageY, demandeId, status });
  };

  const estTraitee = (status) =>
    ["approuve", "rejetee_chef", "rejetee_directeur",
     "en_attente_directeur", "livree", "livree_partiel",
     "epuise", "annulee"].includes(status);

  const handleAnnuler = async () => {
    if (estTraitee(menuContextuel.status)) {
      alert("Impossible d'annuler une demande déjà traitée.");
      return;
    }
    await updateDemandeStatus(menuContextuel.demandeId, "annulee");
    fetchDemandes();
    showToast("❌ Votre demande a été annulée.");
  };

  const handleModifier = () => {
    if (estTraitee(menuContextuel.status)) {
      alert("Impossible de modifier une demande déjà traitée.");
      return;
    }
    const demande = demandes.find((d) => d.id === menuContextuel.demandeId);
    if (demande) {
      const ligne = demande.lignes?.[0];
      setNatureSelectionnee(ligne?.materiel_nature || "");
      setMaterielSelectionne(ligne?.materiel_nom || "");
      setQuantite(ligne?.quantite || 1);
      setModeEdition(true);
      setDemandeEnEdition(demande);
    }
  };

  useEffect(() => {
    if (notifications?.length > 0) {
      showToast(notifications[notifications.length - 1].message);
    }
  }, [notifications]);

  const materielsFiltres = materielsDisponibles.filter(
    (m) => m.nature === natureSelectionnee
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "approuve": return "bg-green-600";
      case "rejetee_chef":
      case "rejetee_directeur": return "bg-red-600";
      case "annulee": return "bg-gray-400";
      case "en_attente_chef": return "bg-yellow-500";
      case "en_attente_directeur": return "bg-blue-500";
      case "livree": return "bg-blue-700";
      case "livree_partiel": return "bg-yellow-600";
      case "epuise": return "bg-red-700";
      default: return "bg-gray-500";
    }
  };

  return (
    <div>
      <NavBar titre="Tableau de Bord Demandeur" />
      <div className="p-6 relative">

        {/* Formulaire demande */}
        <div className="mb-4 flex gap-2 flex-wrap">
          <select
            value={natureSelectionnee}
            onChange={(e) => {
              setNatureSelectionnee(e.target.value);
              const premierMateriel = materielsDisponibles.find(
                (m) => m.nature === e.target.value && m.quantite > 0
              );
              if (premierMateriel) setMaterielSelectionne(premierMateriel.nom);
              else setMaterielSelectionne("");
            }}
            className="p-2 border rounded"
          >
            {[...new Set(materielsDisponibles.map((m) => m.nature))].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
            <option value="nouvelle">+ Nouvelle nature</option>
          </select>

          {natureSelectionnee === "nouvelle" && (
            <input
              type="text"
              placeholder="Nouvelle nature"
              value={nouvelleNature}
              onChange={(e) => setNouvelleNature(e.target.value)}
              className="border p-2 rounded"
            />
          )}

          <select
            value={materielSelectionne}
            onChange={(e) => setMaterielSelectionne(e.target.value)}
            className="flex-1 p-2 border rounded"
          >
            {materielsFiltres.map((m) => (
              <option key={m.id} value={m.nom} disabled={m.quantite <= 0}>
                {m.nom} {m.quantite <= 0 ? "(épuisé)" : ""}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            value={quantite}
            onChange={(e) => setQuantite(Number(e.target.value))}
            className="w-24 p-2 border rounded"
            placeholder="Quantité"
          />

          <button
            onClick={handleSubmitDemande}
            className="bg-orange-400 text-white px-4 py-2 rounded hover:bg-orange-500"
          >
            {modeEdition ? "Modifier la demande" : "Faire une demande"}
          </button>

          {modeEdition && (
            <button
              onClick={() => { setModeEdition(false); setDemandeEnEdition(null); }}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              Annuler
            </button>
          )}
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">ID</th>
                <th className="border p-2">Nature</th>
                <th className="border p-2">Matériel</th>
                <th className="border p-2">Quantité</th>
                <th className="border p-2">Date demande</th>
                <th className="border p-2">Date livraison</th>
                <th className="border p-2">Statut</th>
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
                demandes.map((d) => {
                  const ligne = d.lignes?.[0];
                  return (
                    <tr
                      key={d.id}
                      className="hover:bg-gray-100 cursor-pointer"
                      onContextMenu={(e) => handleContextMenu(e, d.id, d.status)}
                    >
                      <td className="border p-2">{d.id}</td>
                      <td className="border p-2">{ligne?.materiel_nature ?? "-"}</td>
                      <td className="border p-2">{ligne?.materiel_nom ?? "-"}</td>
                      <td className="border p-2">{ligne?.quantite ?? "-"}</td>
                      <td className="border p-2">
                        {d.date_demande ? new Date(d.date_demande).toLocaleDateString() : "-"}
                      </td>
                      <td className="border p-2">
                        {d.date_livraison ? new Date(d.date_livraison).toLocaleDateString() : "-"}
                      </td>
                      <td className="border p-2">
                        <span className={`px-2 py-1 rounded text-white text-sm ${getStatusColor(d.status)}`}>
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
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
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleModifier}
              className="block w-full px-4 py-2 hover:bg-yellow-100 text-left"
            >
              ✏️ Modifier
            </button>
            <button
              onClick={handleAnnuler}
              className="block w-full px-4 py-2 hover:bg-red-100 text-left"
            >
              ❌ Annuler
            </button>
          </div>
        )}

        {/* Toasts */}
        <div className="fixed bottom-4 right-4 space-y-2 z-50">
          {toasts.map((t) => (
            <div key={t.id} className="bg-gray-800 text-white px-4 py-2 rounded shadow-lg">
              {t.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
