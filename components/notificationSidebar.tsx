'use client';
import { useEffect, useState } from "react";

type Notification = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationSidebar({ email }: { email: string }) {
  const [notifs, setNotifs] = useState<Notification[]>([]);

  const fetchNotifs = async () => {
    const res = await fetch(`/api/notifications?email=${email}`);
    const data = await res.json();
    setNotifs(data.notifications);
  };

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    setNotifs(notifs.map(n => n.id === id ? { ...n, read: true } : n));
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [email]);

  return (
    <div className="p-4 border-l w-[300px] bg-gray-50">
      <h3 className="font-bold mb-4 text-lg">Notifications</h3>
      {notifs.length === 0 ? (
        <p className="text-gray-500 text-sm">No notifications yet</p>
      ) : (
        <ul className="space-y-2">
          {notifs.map(n => (
            <li 
              key={n.id} 
              className={`text-sm p-2 rounded cursor-pointer transition-colors ${
                n.read ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'
              }`}
              onClick={() => !n.read && markAsRead(n.id)}
            >
              <div className="flex items-start gap-2">
                {!n.read && (
                  <span className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                )}
                <div>
                  <p className={n.read ? 'text-gray-600' : 'text-gray-900'}>
                    {n.message}
                  </p>
                  <time className="text-xs text-gray-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </time>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
