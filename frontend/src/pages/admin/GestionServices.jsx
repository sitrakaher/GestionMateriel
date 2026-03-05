import { useState, useEffect, useCallback } from "react"; // API à créer
import { addService, deleteService, getServices, updateService } from "../../api/api";

export default function GestionServices() {
  const [services, setServices] = useState([]);
  const [menuContextuel, setMenuContextuel] = useState({ visible: false, x: 0, y: 0, service: null });
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({ nom: "" });
  const [isEditing, setIsEditing] = useState(false);

  // 🔹 Charger tous les services
  const fetchServices = useCallback(async () => {
    const data = await getServices();
    setServices(data);
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // 🔹 Clic droit
  const handleContextMenu = (e, service) => {
    e.preventDefault();
    setMenuContextuel({ visible: true, x: e.pageX, y: e.pageY, service });
  };

  const fermerMenu = () => setMenuContextuel({ ...menuContextuel, visible: false });

  useEffect(() => {
    document.addEventListener("click", fermerMenu);
    return () => document.removeEventListener("click", fermerMenu);
  }, []);

  // 🔹 Supprimer service
  const handleSupprimer = async () => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce service ?")) return;
    await deleteService(menuContextuel.service.id);
    fetchServices();
    fermerMenu();
  };

  // 🔹 Modifier service
  const handleModifier = () => {
    setFormData({ nom: menuContextuel.service.nom });
    setIsEditing(true);
    setFormVisible(true);
    fermerMenu();
  };

  // 🔹 Ajouter service
  const handleAjouter = () => {
    setFormData({ nom: "" });
    setIsEditing(false);
    setFormVisible(true);
  };

  // 🔹 Soumettre formulaire
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (isEditing) {
      await updateService(menuContextuel.service.id, formData.nom);
    } else {
      await addService(formData.nom);
    }
    setFormVisible(false);
    fetchServices();
  };

  return (
    <div className="p-2 relative">
      <h2 className="text-2xl font-bold mb-4">Gestion des services</h2>
      <button
        onClick={handleAjouter}
        className="mb-4 px-4 py-2 bg-indigo-900 text-white rounded hover:bg-indigo-950"
      >
        ➕ Ajouter un service
      </button>

      {/* Tableau des services */}
      <div className="overflow-x-auto bg-white shadow rounded p-4">
        <table className="w-full border border-gray-300">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">Nom du service</th>
              <th className="p-2 border">Date création</th>
            </tr>
          </thead>
          <tbody>
            {services.length > 0 ? (
              services.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-gray-100 cursor-pointer"
                  onContextMenu={(e) => handleContextMenu(e, s)}
                >
                  <td className="p-2 border">{s.nom}</td>
                  <td className="p-2 border">{s.created_at}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="p-4 text-center text-gray-500">
                  Aucun service
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Menu contextuel clic droit */}
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
            onClick={handleSupprimer}
            className="block w-full px-4 py-2 hover:bg-red-100 text-left"
          >
            🗑 Supprimer
          </button>
        </div>
      )}

      {/* Formulaire intégré d'ajout/modification */}
      {formVisible && (
        <form
          onSubmit={handleSubmitForm}
          className="mt-6 p-4 bg-gray-50 rounded shadow space-y-4 max-w-md"
        >
          <h3 className="text-lg font-bold">{isEditing ? "Modifier le service" : "Ajouter un service"}</h3>
          <input
            type="text"
            value={formData.nom}
            onChange={(e) => setFormData({ nom: e.target.value })}
            placeholder="Nom du service"
            className="w-full p-2 border rounded"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            {isEditing ? "Enregistrer" : "Ajouter"}
          </button>
          <button
            type="button"
            onClick={() => setFormVisible(false)}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Annuler
          </button>
        </form>
      )}
    </div>
  );
}
