// notificationContext.jsx
import { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";
import { getNotifications, markNotificationRead } from "../api/api";
import { useAuth } from "./authContext";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const intervalRef = useRef(null); // ✅ référence stable à l'interval

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return; // ✅ stopper si pas d'utilisateur connecté
    try {
      const data = await getNotifications(user.id);
      if (Array.isArray(data)) setNotifications(data);
    } catch (err) {
      console.error("Erreur notifications :", err);
    }
  }, [user?.id]);

  const readNotification = async (notifId) => {
    try {
      await markNotificationRead(notifId);
      fetchNotifications();
    } catch (err) {
      console.error("Erreur lecture notification :", err);
    }
  };

  useEffect(() => {
    // ✅ Si pas d'utilisateur : vider les notifications et stopper l'interval
    if (!user?.id) {
      setNotifications([]);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // ✅ Fetch immédiat à la connexion
    fetchNotifications();

    // ✅ Démarrer l'interval seulement si user connecté
    intervalRef.current = setInterval(fetchNotifications, 5000);

    // ✅ Cleanup à la déconnexion ou changement d'utilisateur
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user?.id, fetchNotifications]); // ✅ re-exécuté uniquement si l'ID change

  return (
    <NotificationContext.Provider value={{ notifications, readNotification, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications doit être utilisé à l'intérieur d'un NotificationProvider");
  }
  return context;
};
