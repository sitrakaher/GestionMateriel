// src/pages/GestionUtilisateurs.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // updateUser à gérer dans api.js
import { deleteUser, getServices, getUsers, updateUser } from "../../api/api";

export default function GestionUtilisateurs() {
  const navigate = useNavigate();
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [menuContextuel, setMenuContextuel] = useState({ visible: false, x: 0, y: 0, user: null });
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({ email: "", role: "", service: "" });
  const [services, setServices] = useState({});

  // 🔹 Charger tous les utilisateurs
  const fetchUtilisateurs = useCallback(async () => {
    try {
      const data = await getUsers();
      setUtilisateurs(data);
    } catch (err) {
      console.error("Erreur getUsers :", err);
    }
  }, []);

  useEffect(() => {
    fetchUtilisateurs();
  }, [fetchUtilisateurs]);
  
  // charger tous les services
   useEffect(() => {
      async function fetchServices() {
        try {
          const data = await getServices();
          setServices(data);
        } catch (err) {
          console.error("Erreur récupération services :", err);
        }
      }
      fetchServices();
    }, []);

  // 🔹 Clic droit sur un utilisateur
  const handleContextMenu = (e, user) => {
    e.preventDefault();
    setMenuContextuel({ visible: true, x: e.pageX, y: e.pageY, user });
  };

  const fermerMenu = () => setMenuContextuel({ ...menuContextuel, visible: false });

  useEffect(() => {
    document.addEventListener("click", fermerMenu);
    return () => document.removeEventListener("click", fermerMenu);
  }, []);

  // 🔹 Supprimer utilisateur
  const handleSupprimer = async () => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;
    try {
      await deleteUser(menuContextuel.user.id);
      fetchUtilisateurs();
      fermerMenu();
    } catch (err) {
      console.error("Erreur deleteUser :", err);
      alert("❌ Erreur lors de la suppression");
    }
  };

  // 🔹 Modifier utilisateur
  const handleModifier = () => {
    const u = menuContextuel.user;
    setFormData({ email: u.email, role: u.role, service: u.service || "" });
    setFormVisible(true);
    fermerMenu();
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      await updateUser(menuContextuel.user.id, formData); // à gérer dans api.js
      setFormVisible(false);
      fetchUtilisateurs();
    } catch (err) {
      console.error(err);
      alert("❌ Erreur lors de la modification");
    }
  };
  return (
    <div className="p-2 relative">
      <h2 className="text-2xl font-bold mb-4">Gestion des utilisateurs</h2>
      <button
        onClick={() => navigate("/inscription")}
        className="mb-4 px-4 font-bold py-2 bg-indigo-900 text-white rounded hover:bg-indigo-950"
      >
        ➕ Créer un utilisateur
      </button>

      {/* Tableau des utilisateurs */}
      <div className="overflow-x-auto bg-white shadow rounded p-4">
        <table className="w-full border border-gray-300">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">Rôle</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Service</th>
              <th className="p-2 border">Date création</th>
            </tr>
          </thead>
          <tbody>
            {utilisateurs.length > 0 ? (
              utilisateurs.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-100 cursor-pointer"
                  onContextMenu={(e) => handleContextMenu(e, user)}
                >
                  <td className="p-2 border">{user.role}</td>
                  <td className="p-2 border">{user.email}</td>
                  <td className="p-2 border">{user.service || "-"}</td>
                  <td className="p-2 border">{user.created_at}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">
                  Aucun utilisateur
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

      {/* Formulaire intégré de modification (overlay) */}
      {formVisible && (
        <form
          onSubmit={handleSubmitForm}
          className="absolute top-20 left-1/2 -translate-x-1/2 z-50 p-6 bg-white rounded shadow-lg space-y-4 w-96"
        >
          <h3 className="text-lg font-bold">Modifier l'utilisateur</h3>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Email"
            className="w-full p-2 border rounded"
            required
          />
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option>Demandeur</option>
            <option>Chef de service</option>
            <option>Directeur</option>
            <option>Magasinier</option>
            <option>Admin</option>
          </select>
          <select
            value={formData.service}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full p-2 border rounded"
          >
            {services.map((s) => (
                      <option key={s.id} value={s.nom}>
                        {s.nom}
                      </option>
                    ))}
          </select>
          <div className="flex justify-between">
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => setFormVisible(false)}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
