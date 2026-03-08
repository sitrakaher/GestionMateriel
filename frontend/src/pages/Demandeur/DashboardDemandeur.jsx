import { useEffect, useState, useCallback } from "react";
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
  const { notifications } = useNotifications(); // 🔔 notifications backend
  const service = user?.service_name || user?.service || "Informatique";

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
    visible: false,
    x: 0,
    y: 0,
    demandeId: null,
    status: null,
  });

  // 🔹 Toasts
  const [toasts, setToasts] = useState([]);
  const showToast = (message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // 🔹 Récupérer les demandes
  const fetchDemandes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDemandes(service);
      setDemandes(data);
    } finally {
      setLoading(false);
    }
  }, [service]);

  // 🔹 Récupérer les matériels
  const fetchMateriels = useCallback(async () => {
    const data = await getMateriels();
    setMaterielsDisponibles(data);

    if (data.length > 0 && !natureSelectionnee) {
      const premiereNature = data[0].nature;
      setNatureSelectionnee(premiereNature);
      const premierMateriel = data.find(
        (m) => m.nature === premiereNature && m.quantite > 0
      );
      if (premierMateriel) setMaterielSelectionne(premierMateriel.nom);
    }
  }, [natureSelectionnee]);

  useEffect(() => {
    fetchDemandes();
    fetchMateriels();
  }, [fetchDemandes, fetchMateriels]);

  // 🔹 Créer ou modifier une demande
  const handleSubmitDemande = async () => {
    if (!materielSelectionne || quantite < 1) return;

    let natureFinale = natureSelectionnee;
    if (natureSelectionnee === "nouvelle") {
      if (!nouvelleNature) {
        alert("Veuillez saisir la nouvelle nature.");
        return;
      }
      natureFinale = nouvelleNature;

      // Ajouter le nouveau matériel
      const nouveauMateriel = await addMateriel({
        nom: materielSelectionne,
        nature: natureFinale,
        prix: 0,
        quantite: 0,
      });
      if (!nouveauMateriel) return;
      fetchMateriels();
    }

    const lignes = [{ materiel: materielSelectionne, quantite, nature: natureFinale }];

    if (modeEdition && demandeEnEdition) {
      await updateDemande(demandeEnEdition.id, { materiel: materielSelectionne, quantite, nature: natureFinale });
      setModeEdition(false);
      setDemandeEnEdition(null);
      showToast("✅ Demande modifiée avec succès !");
    } else {
      await createDemande(user.id, user.service_id, lignes);
      showToast("📨 Demande envoyée au chef de service !");
    }

    setQuantite(1);
    await fetchDemandes();
  };

  // 🔹 Menu contextuel
  const handleContextMenu = (e, demandeId, status) => {
    e.preventDefault();
    setMenuContextuel({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      demandeId,
      status,
    });
  };

  const fermerMenu = () => setMenuContextuel({ ...menuContextuel, visible: false });

  useEffect(() => {
    document.addEventListener("click", fermerMenu);
    return () => document.removeEventListener("click", fermerMenu);
  }, []);

  // 🔹 Annuler demande
  const handleAnnuler = async () => {
    if (menuContextuel.status === "approuve" || menuContextuel.status === "rejete") {
      alert("Impossible d'annuler une demande déjà traitée.");
      return;
    }
    await updateDemandeStatus(menuContextuel.demandeId, "annulee");
    fetchDemandes();
    showToast("❌ Votre demande a été annulée.");
    fermerMenu();
  };

  // 🔹 Modifier demande
  const handleModifier = () => {
    if (menuContextuel.status === "approuve" || menuContextuel.status === "rejete") {
      alert("Impossible de modifier une demande déjà traitée.");
      return;
    }
    const demande = demandes.find((d) => d.id === menuContextuel.demandeId);
    if (demande) {
      setNatureSelectionnee(demande.nature);
      setMaterielSelectionne(demande.materiel);
      setQuantite(demande.quantite);
      setModeEdition(true);
      setDemandeEnEdition(demande);
    }
    fermerMenu();
  };

  // 🔹 Afficher notifications backend
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const lastNotif = notifications[notifications.length - 1];
      showToast(lastNotif.message);
    }
  }, [notifications]);

  // 🔹 Liste filtrée des matériels par nature
  const materielsFiltres = materielsDisponibles.filter(
    (m) => m.nature === natureSelectionnee
  );

  return (
    <div>
      <NavBar titre="Tableau de Bord Demandeur"/>
    <div className="p-6 relative">

      {/* Formulaire demande */}

      <div className="mb-4 flex gap-2">
        <select
          value={natureSelectionnee}
          onChange={(e) => {
            setNatureSelectionnee(e.target.value);
            const premierMateriel = materielsDisponibles.find(
              (m) => m.nature === e.target.value && m.quantite > 0
            );
            if (premierMateriel) setMaterielSelectionne(premierMateriel.nom);
          }}
          className="p-2 border rounded"
        >
          {[...new Set(materielsDisponibles.map((m) => m.nature))].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
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
      </div>

      {/* Tableau demandes */}
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
              <th className="border p-2">Statut Livraison</th>
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
              demandes.map((d) => (
                <tr
                  key={d.id}
                  className="hover:bg-gray-100 cursor-pointer"
                  onContextMenu={(e) => handleContextMenu(e, d.id, d.status)}
                >
                  <td className="border p-2">{d.id}</td>
                  <td className="border p-2">{d.nature}</td>
                  <td className="border p-2">{d.materiel}</td>
                  <td className="border p-2">{d.quantite}</td>
                  <td className="border p-2">{d.date_demande}</td>
                  <td className="border p-2">{d.date_livraison || "-"}</td>
                  <td className="border p-2">
                    <span
                      className={`px-2 py-1 rounded text-white ${
                        d.status === "approuve"
                          ? "bg-green-600"
                          : d.status === "rejete"
                          ? "bg-red-600"
                          : d.status === "annulee"
                          ? "bg-gray-400"
                          : "bg-gray-500"
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="border p-2">
                    <span
                      className={`px-2 py-1 rounded text-white ${
                        d.livraison_status === "totale"
                          ? "bg-green-700"
                          : d.livraison_status === "partielle"
                          ? "bg-yellow-600"
                          : d.livraison_status === "epuise"
                          ? "bg-red-700"
                          : "bg-gray-500"
                      }`}
                    >
                      {d.livraison_status || "en attente"}
                    </span>
                  </td>
                </tr>
              ))
             ) : (
              <tr>
                <td colSpan="8" className="text-center p-4 text-gray-500">
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

      {/* 🔔 Toast Notifications */}
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
