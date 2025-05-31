'use client';
import { useEffect, useState } from "react";

type Notification = {
  id: string;
  title: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationSidebar({ email }: { email: string }) {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifs = async () => {
    try {
      const res = await fetch(`/api/notifications?email=${email}`);
      if (!res.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await res.json();
      setNotifs(data.notifications || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: email })
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }
      
      setNotifs(notifs.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    if (email) {
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 30000); // poll every 30s
      return () => clearInterval(interval);
    }
  }, [email]);

  // Helper functions remain the same...
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'blog': return '📝';
      case 'job': return '💼';
      case 'like': return '👍';
      case 'application': return '📋';
      case 'follow': return '👥';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'blog': return 'text-blue-600 bg-blue-50';
      case 'job': return 'text-green-600 bg-green-50';
      case 'like': return 'text-purple-600 bg-purple-50';
      case 'application': return 'text-orange-600 bg-orange-50';
      case 'follow': return 'text-indigo-600 bg-indigo-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const notifDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - notifDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notifDate.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="w-80 h-screen bg-white border-r border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Header - fixed at top */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            Notifications
          </h3>
          <div className="flex items-center gap-2">
            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
              {notifs.filter(n => !n.read).length} new
            </span>
            <button 
              onClick={fetchNotifs}
              className="text-gray-400 hover:text-gray-600 p-1 rounded"
              title="Refresh"
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="px-6 py-3">
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Scrollable notifications list */}
      <div className="flex-1 overflow-y-auto p-6">
        {notifs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">🔔</div>
            <p className="text-gray-500 text-sm">No notifications yet</p>
            <p className="text-gray-400 text-xs mt-1">
              You'll see updates here when people interact with your content
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifs.map(notification => (
              <div 
                key={notification.id} 
                className={`relative rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm ${
                  notification.read 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-white border-purple-200 shadow-sm hover:border-purple-300'
                }`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                {!notification.read && (
                  <div className="absolute -left-1 top-3 w-2 h-2 bg-purple-500 rounded-full"></div>
                )}

                <div className="p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-medium truncate ${
                        notification.read ? 'text-gray-700' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </h4>
                      <p className={`text-sm mt-1 leading-relaxed ${
                        notification.read ? 'text-gray-500' : 'text-gray-700'
                      }`}>
                        {notification.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                    <time className="text-xs text-gray-400">
                      {getRelativeTime(notification.createdAt)}
                    </time>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getNotificationColor(notification.type)}`}>
                      {notification.type}
                    </span>
                  </div>
                </div>

                {!notification.read && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-purple-50 opacity-20 rounded-lg pointer-events-none"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - fixed at bottom */}
      {notifs.length > 0 && (
        <div className="p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={fetchNotifs}
            className="w-full text-sm text-purple-600 hover:text-purple-800 font-medium"
          >
            Refresh Notifications
          </button>
        </div>
      )}
    </div>
  );
}
