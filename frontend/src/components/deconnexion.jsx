// components/LogoutButton.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../api/api";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/connexion");
  };

  return (
    <button
      onClick={handleLogout}
      className="w-auto bg-red-600 text-white p-2 rounded hover:bg-red-700 font-bold"
    >
      🚪 Déconnexion
    </button>
  );
}
