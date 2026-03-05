import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { setToken as setAxiosToken } from "../api/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [role, setRole] = useState(localStorage.getItem("role") || null);
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = (nouveauToken, nouveauRole, userData) => {
    localStorage.setItem("token", nouveauToken);
    localStorage.setItem("role", nouveauRole);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(nouveauToken);
    setRole(nouveauRole);
    setUser(userData);
    setAxiosToken(nouveauToken);

    // si jamais un jour l'API renvoie un service_name, on le persiste
    if (userData?.service_name) {
      localStorage.setItem("service", userData.service_name);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("service");
    setToken(null);
    setRole(null);
    setUser(null);
    setAxiosToken(null);
  };

  useEffect(() => {
    if (token) setAxiosToken(token);
  }, [token]);

  const value = useMemo(() => ({ token, role, user, login, logout }), [token, role, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
