import { useNotifications } from "../context/notificationContext";

export default function NotificationBell() {
  const { notifications, readNotification } = useNotifications();

  return (
    <div className="relative">
      <button className="relative">
        🔔
        {notifications.filter(n => !n.lu).length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-2 rounded-full">
            {notifications.filter(n => !n.lu).length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 mt-2 w-72 bg-white border shadow-lg rounded">
        {notifications.length > 0 ? notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => readNotification(notif.id)}
            className={`p-2 cursor-pointer ${notif.lu ? "bg-gray-100" : "bg-blue-100"}`}
          >
            {notif.message}
          </div>
        )) : (
          <div className="p-2 text-gray-500">Aucune notification</div>
        )}
      </div>
    </div>
  );
}
