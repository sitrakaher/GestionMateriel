import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login as apiLogin, getServices } from "../../api/api";
import { Jirama } from "../../components/Jirama";
import { useAuth } from "../../context/authContext";

export default function Connexion() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("Demandeur");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [service, setService] = useState("");
  const [services, setServices] = useState([]);
  const [erreur, setErreur] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setEmail("");
    setPassword("");
    setService("");
    setErreur("");
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setErreur("Veuillez remplir tous les champs !");
      return;
    }

    setErreur("");
    setLoading(true);

    try {
      const data = await apiLogin(email, password, role, service);

      const token = data.access_token || data.token;

      if (token && data.user) {
        login(token, data.user.role, data.user);

        // Redirection selon rôle + service
        const r = data.user.role;
        const userService = (data.user.service || service).toLowerCase();

        switch (r) {
          case "Admin":
            navigate("/dashboard-admin");
            break;
          case "Directeur":
            navigate("/dashboard-directeur");
            break;
          case "Magasinier":
            navigate("/dashboard-magasinier");
            break;
          case "Demandeur":
            navigate(`/dashboard/demandeur/${userService}`);
            break;
          case "Chef de service":
            navigate(`/dashboard/chef/${userService}`);
            break;
          default:
            navigate("/");
        }
      } else {
        setErreur(data.error || "Identifiant ou mot de passe incorrect");
      }
    } catch (err) {
      setErreur(
        err.response?.data?.detail || "Impossible de contacter le serveur. Vérifiez votre connexion."
      );
    } finally {
      setLoading(false);
    }
  };

  const showService = role === "Demandeur" || role === "Chef de service";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-2xl shadow-lg w-96">
        <Jirama />
        <h2 className="text-2xl font-bold text-center mb-4">Se connecter</h2>
        <div className="bg-indigo-950 p-6">
          {erreur && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{erreur}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-bold text-white">Rôle</label>
              <select
                value={role}
                onChange={handleRoleChange}
                className="w-full p-2 border rounded-lg bg-white"
              >
                <option>Admin</option>
                <option>Demandeur</option>
                <option>Chef de service</option>
                <option>Directeur</option>
                <option>Magasinier</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-bold text-white">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded-lg bg-white"
                placeholder="exemple@mail.com"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-white">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded-lg bg-white"
                placeholder="••••••••"
                required
              />
            </div>

            {showService && (
              <div>
                <label className="block mb-1 font-bold text-white">Nom du service</label>
                
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-white"
                >
                {services.map((s)=>(
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
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm">
            <Link to="/forgot-password" className="text-white hover:underline">
              Mot de passe oublié ?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
