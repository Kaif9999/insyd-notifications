'use client';

import { useState, useEffect } from 'react';
import BlogsSection from './blogsSection';
import JobsSection from './jobsSection';
import BlogForm from './blogForm';
import JobForm from './jobForm';

interface Blog {
  id: string;
  title: string;
  content: string;
  author: { email: string };
  createdAt: string;
  likes: number;
}

interface Job {
  id: string;
  title: string;
  company: string;
  author: { email: string };
  createdAt: string;
  applications: number;
  hasApplied?: boolean;
}

interface MainContentProps {
  userEmail: string | null;
  onLogout: () => void;
}

export default function MainContent({ userEmail, onLogout }: MainContentProps) {
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Fetch blogs
  useEffect(() => {
    if (!userEmail) return;
    
    fetch("/api/blogs")
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.text();
      })
      .then(text => {
        if (!text) {
          throw new Error('Empty response');
        }
        const data = JSON.parse(text);
        setBlogs(data.blogs || []);
        setError(null);
      })
      .catch((err: Error) => {
        console.error('Error fetching blogs:', err);
        setError(`Failed to fetch blogs: ${err.message}`);
        setBlogs([]);
      });
  }, [refresh, userEmail]);

  // Fetch jobs
  useEffect(() => {
    if (!userEmail) return;
    
    fetch(`/api/jobs?currentUser=${encodeURIComponent(userEmail)}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.text();
      })
      .then(text => {
        if (!text) {
          throw new Error('Empty response');
        }
        const data = JSON.parse(text);
        setJobs(data.jobs || []);
        setError(null);
      })
      .catch((err: Error) => {
        console.error('Error fetching jobs:', err);
        setError(`Failed to fetch jobs: ${err.message}`);
        setJobs([]);
      });
  }, [refresh, userEmail]);

  // Auto refresh
  useEffect(() => {
    if (!userEmail) return;
    const interval = setInterval(() => setRefresh(r => r + 1), 30000);
    return () => clearInterval(interval);
  }, [userEmail]);

  const handleRefresh = () => setRefresh(r => r + 1);

  const handleBlogSubmit = async (title: string, content: string) => {
    const body = {
      email: userEmail,
      title,
      content,
    };
    
    try {
      const response = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      setShowBlogForm(false);
      handleRefresh();
      setError(null);
    } catch (error) {
      console.error('Error submitting blog:', error);
      throw new Error(`Failed to submit blog: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleJobSubmit = async (title: string, company: string) => {
    const body = {
      email: userEmail,
      company,
      title,
    };
    
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      setShowJobForm(false);
      handleRefresh();
      setError(null);
    } catch (error) {
      console.error('Error submitting job:', error);
      throw new Error(`Failed to submit job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleLikeBlog = async (blogId: string) => {
    try {
      const response = await fetch(`/api/blogs/${blogId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      handleRefresh();
    } catch (error) {
      console.error('Error liking blog:', error);
      setError(`Failed to like blog: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleApplyJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      handleRefresh();
    } catch (error) {
      console.error('Error applying to job:', error);
      setError(`Failed to apply to job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    try {
      const response = await fetch(`/api/blogs/${blogId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      handleRefresh();
    } catch (error) {
      console.error('Error deleting blog:', error);
      setError(`Failed to delete blog: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      handleRefresh();
    } catch (error) {
      console.error('Error deleting job:', error);
      setError(`Failed to delete job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <main className="flex-1 ml-80 mr-80 p-8 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Insyd - Architecture Social Platform
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Welcome, {userEmail}</span>
          <button 
            onClick={onLogout}
            className="text-sm text-red-600 hover:text-red-800 hover:underline transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {/* Blogs Section */}
      <BlogsSection 
        blogs={blogs}
        userEmail={userEmail || ""}
        onLikeBlog={handleLikeBlog}
        onDeleteBlog={handleDeleteBlog}
      />
      
      {/* Jobs Section */}
      <JobsSection 
        jobs={jobs}
        userEmail={userEmail || ""}
        onApplyJob={handleApplyJob}
        onDeleteJob={handleDeleteJob}
      />

      {/* Bottom Action Buttons */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-20">
        <button 
          onClick={() => setShowBlogForm(true)} 
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          Post Blog
        </button>
        <button 
          onClick={() => setShowJobForm(true)} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          Post Job
        </button>
      </div>

      {/* Modal Forms */}
      {showBlogForm && (
        <BlogForm 
          onSubmit={handleBlogSubmit}
          onCancel={() => setShowBlogForm(false)}
        />
      )}

      {showJobForm && (
        <JobForm 
          onSubmit={handleJobSubmit}
          onCancel={() => setShowJobForm(false)}
        />
      )}
    </main>
  );
}