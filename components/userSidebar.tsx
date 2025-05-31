"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string | null;
  followers: number;
  following: number;
  blogs: number;
  jobs: number;
  isFollowing: boolean;
  createdAt: string;
}

interface UserSidebarProps {
  currentUserEmail: string;
}

export default function UserSidebar({ currentUserEmail }: UserSidebarProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/users?currentUser=${encodeURIComponent(currentUserEmail)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.users || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserEmail) {
      fetchUsers();
    }
  }, [currentUserEmail]);

  const handleFollow = async (userEmail: string) => {
    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followerEmail: currentUserEmail,
          followingEmail: userEmail
        })
      });

      if (!response.ok) {
        throw new Error('Failed to follow user');
      }

      fetchUsers();
    } catch (error) {
      console.error('Error following user:', error);
      setError('Failed to follow user');
    }
  };

  const handleUnfollow = async (userEmail: string) => {
    try {
      const response = await fetch('/api/follow', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followerEmail: currentUserEmail,
          followingEmail: userEmail
        })
      });

      if (!response.ok) {
        throw new Error('Failed to unfollow user');
      }

      fetchUsers();
    } catch (error) {
      console.error('Error unfollowing user:', error);
      setError('Failed to unfollow user');
    }
  };

  if (loading) {
    return (
      <div className="w-80 h-screen bg-white border-l border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 h-screen bg-white border-l border-gray-200 flex flex-col">
      {/* Header - fixed at top */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-xl font-semibold text-gray-900">
          Community Members
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Discover and follow architects
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="px-6 py-3">
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Scrollable users list */}
      <div className="flex-1 overflow-y-auto p-6">
        {users.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            <p>No other users yet</p>
            <button 
              onClick={fetchUsers}
              className="mt-2 text-sm text-purple-600 hover:text-purple-800"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {user.name || user.email.split('@')[0]}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={() => 
                      user.isFollowing 
                        ? handleUnfollow(user.email)
                        : handleFollow(user.email)
                    }
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      user.isFollowing
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {user.isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Followers:</span>
                    <span className="font-medium">{user.followers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Following:</span>
                    <span className="font-medium">{user.following}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Blogs:</span>
                    <span className="font-medium">{user.blogs}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Jobs:</span>
                    <span className="font-medium">{user.jobs}</span>
                  </div>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - fixed at bottom */}
      <div className="p-6 border-t border-gray-200 flex-shrink-0">
        <button
          onClick={fetchUsers}
          className="w-full text-sm text-purple-600 hover:text-purple-800 font-medium"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}