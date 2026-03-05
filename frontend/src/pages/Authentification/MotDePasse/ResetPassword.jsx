// src/pages/ResetPassword.jsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../api/api1";
import { Jirama } from "../../../components/Jirama";

export default function ResetPassword() {
  const { token } = useParams(); // route: /reset-password/:token
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");
    if (!newPassword || !confirm) return setErr("Veuillez remplir tous les champs");
    if (newPassword !== confirm) return setErr("Les mots de passe ne correspondent pas");
    setLoading(true);
    const res = await resetPassword(token, newPassword);
    setLoading(false);
    if (res.error) setErr(res.error);
    else {
      setMsg(res.message || "Mot de passe réinitialisé");
      setTimeout(() => navigate("/login"), 1200);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-2xl shadow-lg w-96">
        <Jirama />
        <h2 className="text-2xl font-bold text-center mb-4">Réinitialiser le mot de passe</h2>
        <div className="bg-indigo-950 p-6">
          {err && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{err}</div>}
          {msg && <div className="bg-green-100 text-green-700 p-2 mb-4 rounded">{msg}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-white font-bold">Nouveau mot de passe</label>
              <input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} className="w-full p-2 border rounded-lg bg-white" required/>
            </div>
            <div>
              <label className="block mb-1 text-white font-bold">Confirmer</label>
              <input type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} className="w-full p-2 border rounded-lg bg-white" required/>
            </div>
            <button type="submit" className={`w-full text-white p-2 rounded-lg ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`} disabled={loading}>
              {loading ? "Traitement..." : "Réinitialiser"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
