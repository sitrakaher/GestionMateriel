// src/pages/Inscription.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { getServices, inscription } from "../../api/api";
import { Jirama } from "../../components/Jirama";

export default function Inscription() {
  const { role: roleGlobal } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("Demandeur");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [service, setService] = useState("");
  const [services, setServices] = useState([]);
  const [erreur, setErreur] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirection si pas admin
  useEffect(() => {
    if (roleGlobal !== "Admin") {
      navigate("/dashboard");
    }
  }, [roleGlobal, navigate]);

  // Récupérer les services
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

  const handleRoleChange = (e) => {
    const nouveauRole = e.target.value;
    setRole(nouveauRole);
    setEmail("");
    setMotDePasse("");
    setConfirmation("");
    setService(""); // reset toujours
    setErreur("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !motDePasse || !confirmation) {
      setErreur("Veuillez remplir tous les champs !");
      return;
    }

    if (motDePasse !== confirmation) {
      setErreur("Les mots de passe ne correspondent pas !");
      return;
    }

    // Vérification du service si nécessaire
    if ((role === "Demandeur" || role === "Chef de service") && !service) {
      setErreur("Veuillez choisir un service !");
      return;
    }

    setErreur("");
    setSuccess("");
    setLoading(true);

    try {
      let service_id = null;
      if (role === "Demandeur" || role === "Chef de service") {
        const serviceObj = services.find((s) => s.nom === service);
        service_id = serviceObj?.id;
      }

      const data = await inscription(email, motDePasse, role, service_id);

      if (data.error) {
        setErreur(data.error);
        setSuccess("");
      } else {
        setSuccess("Utilisateur créé avec succès !");
        setEmail("");
        setMotDePasse("");
        setConfirmation("");
        setService("");

        setTimeout(() => {
          navigate("/dashboard-admin");
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      setErreur("Impossible de contacter le serveur");
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  const showService = role === "Demandeur" || role === "Chef de service";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-2xl shadow-lg w-96">
        <Jirama />
        <h2 className="text-2xl font-bold text-center mb-4">Créer un utilisateur</h2>

        {roleGlobal !== "Admin" ? (
          <p className="text-red-600 text-center p-4">
            Seul l’administrateur peut créer un utilisateur.
          </p>
        ) : (
          <div className="bg-indigo-950 p-6">
            {erreur && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{erreur}</div>}
            {success && <div className="bg-green-100 text-green-700 p-2 mb-4 rounded">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Rôle */}
              <div>
                <label className="block mb-1 text-white font-bold">Rôle</label>
                <select
                  value={role}
                  onChange={handleRoleChange}
                  className="w-full p-2 border rounded-lg bg-white"
                >
                  <option>Demandeur</option>
                  <option>Chef de service</option>
                  <option>Directeur</option>
                  <option>Magasinier</option>
                </select>
              </div>

              {/* Email */}
              <div>
                <label className="block mb-1 text-white font-bold">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-white"
                  placeholder="exemple@mail.com"
                  required
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block mb-1 text-white font-bold">Mot de passe</label>
                <input
                  type="password"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-white"
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Confirmation */}
              <div>
                <label className="block mb-1 text-white font-bold">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-white"
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Service obligatoire uniquement pour certains rôles */}
              {showService && (
                <div>
                  <label className="block mb-1 text-white font-bold">Nom du service</label>
                  <select
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white"
                    required
                  >
                    <option value="">-- Choisir un service --</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.nom}>
                        {s.nom}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className={`w-full text-white p-2 rounded-lg ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
                disabled={loading}
              >
                {loading ? "Création..." : "Créer l'utilisateur"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
