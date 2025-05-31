'use client';

import { useState } from 'react';

interface EmailRegistrationFormProps {
  onEmailSubmit: (email: string) => Promise<void>;
}

export default function EmailRegistrationForm({ onEmailSubmit }: EmailRegistrationFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    
    try {
      await onEmailSubmit(email);
    } catch (error) {
      setError(`Failed to register: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to <span className="text-purple-300 italic">Insyd</span><br/>
            Notifications
          </h1>
          <p className="text-purple-100 text-lg">
            The architecture community&apos;s notification hub
          </p>
        </div>

        <div className="bg-blue-100/20 border border-blue-300/30 text-blue-100 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-300 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">
              Please enter a real email address so we can deliver email notifications about new posts, likes, and social activity.
            </span>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-purple-100 mb-2">
              Email Address
            </label>
            <input 
              type="email" 
              name="email" 
              required 
              disabled={isLoading}
              className="w-full px-4 py-3 border border-purple-300/30 rounded-lg text-white bg-white/10 backdrop-blur-sm placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all disabled:opacity-50"
              placeholder="your@email.com"
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transform transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:transform-none"
          >
            {isLoading ? 'Joining...' : 'Join Insyd'}
          </button>
        </form>
      </div>
    </div>
  );
}