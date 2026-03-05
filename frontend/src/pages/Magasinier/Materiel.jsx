import { useState, useEffect } from "react";
import { addMateriel, deleteMateriel, getMateriels, updateMateriel } from "../../api/api";

const Materiel = () => {
  const [materiels, setMateriels] = useState([]);
  const [form, setForm] = useState({ nom: "", nature: "", natureNom: "", prix: "", quantite: "" });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [menuContextuel, setMenuContextuel] = useState({ visible: false, x: 0, y: 0, materiel: null });

  const [naturesDisponibles, setNaturesDisponibles] = useState([]);

  useEffect(() => {
    fetchMateriels();
    document.addEventListener("click", fermerMenu);
    return () => document.removeEventListener("click", fermerMenu);
  }, []);

  const fetchMateriels = async () => {
    const data = await getMateriels();
    setMateriels(data);

    // Générer la liste des natures disponibles
    const natures = [...new Set(data.map((m) => m.nature))];
    setNaturesDisponibles(natures);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const natureFinale = form.nature === "nouvelle" ? form.natureNom : form.nature;

    const materielAEnvoyer = {
      nom: form.nom,
      nature: natureFinale,
      prix: Number(form.prix),
      quantite: Number(form.quantite),
    };

    if (editingId) {
      await updateMateriel(editingId, materielAEnvoyer);
    } else {
      await addMateriel(materielAEnvoyer);
    }

    setForm({ nom: "", nature: "", natureNom: "", prix: "", quantite: "" });
    setEditingId(null);
    setShowForm(false);
    fetchMateriels();
  };
 
  const handleContextMenu = (e, materiel) => {
    e.preventDefault();
    setMenuContextuel({ visible: true, x: e.pageX, y: e.pageY, materiel });
  };

  const fermerMenu = () => setMenuContextuel({ ...menuContextuel, visible: false });

  const handleModifier = () => {
    const m = menuContextuel.materiel;
    setForm({ nom: m.nom, nature: m.nature, natureNom: "", prix: m.prix, quantite: m.quantite });
    setEditingId(m.id);
    setShowForm(true);
    fermerMenu();
  };

  const handleSupprimer = async () => {
    if (!menuContextuel.materiel) return;
    await deleteMateriel(menuContextuel.materiel.id);
    fetchMateriels();
    fermerMenu();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Liste des matériels</h1>

      <button
        className="bg-orange-400 font-bold text-white px-4 py-2 rounded mb-4"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? "Annuler" : "Ajouter un matériel"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-4 rounded shadow">
          <div className="grid grid-cols-2 gap-4">
            <select
              value={form.nature}
              onChange={(e) => setForm({ ...form, nature: e.target.value })}
              className="border p-2 rounded"
              required
            >
              <option value="">-- Sélectionner une nature --</option>
              {naturesDisponibles.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
              <option value="nouvelle">+ Nouvelle nature</option>
            </select>

            {form.nature === "nouvelle" && (
              <input
                type="text"
                placeholder="Nouvelle nature"
                value={form.natureNom || ""}
                onChange={(e) => setForm({ ...form, natureNom: e.target.value })}
                className="border p-2 rounded"
                required
              />
            )}

            <input
              type="text"
              placeholder="Nom du matériel"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className="border p-2 rounded"
              required
            />
            <input
              type="number"
              placeholder="Prix"
              value={form.prix}
              onChange={(e) => setForm({ ...form, prix: e.target.value })}
              className="border p-2 rounded"
              required
            />
            <input
              type="number"
              placeholder="Quantité"
              value={form.quantite}
              onChange={(e) => setForm({ ...form, quantite: e.target.value })}
              className="border p-2 rounded"
              required
            />
          </div>
          <button type="submit" className="mt-4 bg-green-500 text-white px-4 py-2 rounded">
            {editingId ? "Modifier" : "Ajouter"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Numéro d'article</th>
              <th className="border p-2">Nom</th>
              <th className="border p-2">Nature</th>
              <th className="border p-2">Prix</th>
              <th className="border p-2">Quantité</th>
            </tr>
          </thead>
          <tbody>
            {materiels.map((m) => (
              <tr
                key={m.id}
                className="hover:bg-gray-100 cursor-pointer"
                onContextMenu={(e) => handleContextMenu(e, m)}
              >
                <td className="p-2 border">{m.numero_article}</td>
                <td className="p-2 border">{m.nom}</td>
                <td className="p-2 border">{m.nature}</td>
                <td className="p-2 border">{m.prix}</td>
                <td className="p-2 border">{m.quantite}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
    </div>
  );
};

export default Materiel;
