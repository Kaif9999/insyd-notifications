'use client';
import { useEffect, useState } from "react";

export default function NotificationSidebar({ email }: { email: string }) {
  const [notifs, setNotifs] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotifs = async () => {
      const res = await fetch(`/api/notifications?email=${email}`);
      const data = await res.json();
      setNotifs(data.notifications);
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [email]);

  return (
    <div className="p-4 border-l w-[300px]">
      <h3 className="font-bold mb-2">Notifications</h3>
      <ul>
        {notifs.map(n => (
          <li key={n.id} className="text-sm py-1">{n.message}</li>
        ))}
      </ul>
    </div>
  );
}
