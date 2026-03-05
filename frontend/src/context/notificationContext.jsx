// notificationContext.jsx
import { createContext, useState, useEffect, useContext } from "react";
import { getNotifications, markNotificationRead } from "../api/api";
import { useAuth } from "./authContext";

const NotificationContext = createContext();

// 🔹 Provider
export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  // 🔹 Récupérer notifications depuis backend
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await getNotifications(user.id);
      setNotifications(data);
    } catch (err) {
      console.error("Erreur lors de la récupération des notifications :", err);
    }
  };

  // 🔹 Marquer notification comme lue
  const readNotification = async (notifId) => {
    try {
      await markNotificationRead(notifId);
      fetchNotifications();
    } catch (err) {
      console.error("Erreur lors de la lecture de la notification :", err);
    }
  };

  // 🔹 Refresh automatique toutes les 5 secondes
  useEffect(() => {
    if (user) fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <NotificationContext.Provider value={{ notifications, readNotification, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

// 🔹 Hook pour consommer le context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications doit être utilisé à l'intérieur d'un NotificationProvider"
    );
  }
  return context;
};
