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
      console.log('Fetching users for:', currentUserEmail); 
      const response = await fetch(`/api/users?currentUser=${encodeURIComponent(currentUserEmail)}`);
      
      console.log('Response status:', response.status); 
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText); 
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      console.log('Users data received:', data); 
      
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
      console.log('UserSidebar mounted with email:', currentUserEmail); // Debug log
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

      // Refresh users list
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

      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Error unfollowing user:', error);
      setError('Failed to unfollow user');
    }
  };

  if (loading) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6">
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
    <div className="w-80 bg-white border-l border-gray-200 p-6 h-screen overflow-y-auto">
      <div className="sticky top-0 bg-white pb-4 border-b border-gray-200 mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Community Members
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Discover and follow architects
        </p>
        {/* Debug info */}
        <p className="text-xs text-gray-400 mt-2">
          Current user: {currentUserEmail} | Users found: {users.length}
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
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
          users.map((user) => (
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
          ))
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
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