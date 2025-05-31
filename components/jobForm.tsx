'use client';

import { useRef, useState } from 'react';

interface JobFormProps {
  onSubmit: (title: string, company: string) => Promise<void>;
  onCancel: () => void;
}

export default function JobForm({ onSubmit, onCancel }: JobFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const company = formData.get('company') as string;
    
    try {
      await onSubmit(title, company);
      formRef.current?.reset();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    formRef.current?.reset();
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form 
        ref={formRef}
        onSubmit={handleSubmit} 
        className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl"
      >
        <h2 className="text-2xl font-semibold text-gray-900 mb-5">
          Post a Job
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company
          </label>
          <input 
            type="text" 
            name="company" 
            required 
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent disabled:opacity-50 text-black placeholder-gray-700"
            placeholder="Company name" 
          />
        </div>
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Title
          </label>
          <input 
            type="text" 
            name="title" 
            required 
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent disabled:opacity-50 text-black placeholder-gray-700"
            placeholder="Job title" 
          />
        </div>
        <div className="flex gap-3">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Posting...' : 'Post Job'}
          </button>
          <button 
            type="button" 
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}