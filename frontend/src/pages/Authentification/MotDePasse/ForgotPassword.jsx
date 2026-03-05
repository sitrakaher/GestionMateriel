// src/pages/ForgotPassword.jsx
import { useState } from "react";
import { forgotPassword } from "../../../api/api";
import { Jirama } from "../../../components/Jirama";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setErreur("");
    if (!email) {
      setErreur("Veuillez saisir votre email !");
      return;
    }
    setLoading(true);
    const res = await forgotPassword(email);
    setLoading(false);
    if (res.error) setErreur(res.error);
    else setMessage(res.message || "Email de réinitialisation envoyé (vérifie la console si mode dev).");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-2xl shadow-lg w-96">
        <Jirama />
        <h2 className="text-2xl font-bold text-center mb-4">Mot de passe oublié</h2>
        <div className="bg-indigo-950 p-6">
          {erreur && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{erreur}</div>}
          {message && <div className="bg-green-100 text-green-700 p-2 mb-4 rounded">{message}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <button type="submit" className={`w-full p-2 rounded-lg text-white ${loading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`} disabled={loading}>
              {loading ? "Envoi..." : "Envoyer le lien de réinitialisation"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
