"use client";

import { useEffect, useState } from "react";
import NotificationSidebar from "@/components/notificationSidebar";

// Types for Blog and Job
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
}

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(true);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Check if user email is stored in localStorage
  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setUserEmail(storedEmail);
      setShowEmailForm(false);
    }
  }, []);

  // Fetch blogs with error handling
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
      .catch(err => {
        console.error('Error fetching blogs:', err);
        setError(`Failed to fetch blogs: ${err.message}`);
        setBlogs([]);
      });
  }, [refresh, userEmail]);

  // Fetch jobs with error handling
  useEffect(() => {
    if (!userEmail) return;
    
    fetch("/api/jobs")
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
      .catch(err => {
        console.error('Error fetching jobs:', err);
        setError(`Failed to fetch jobs: ${err.message}`);
        setJobs([]);
      });
  }, [refresh, userEmail]);

  // Poll for updates every 30s
  useEffect(() => {
    if (!userEmail) return;
    const interval = setInterval(() => setRefresh(r => r + 1), 30000);
    return () => clearInterval(interval);
  }, [userEmail]);

  // Handle email registration/login
  const handleEmailSubmit = async (e: any) => {
    e.preventDefault();
    const email = e.target.email.value;
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      localStorage.setItem('userEmail', email);
      setUserEmail(email);
      setShowEmailForm(false);
    } catch (error) {
      console.error('Error registering:', error);
      setError(`Failed to register: ${error.message}`);
    }
  };

  // Handle blog submission
  const handleBlogSubmit = async (e: any) => {
    e.preventDefault();
    const form = e.target;
    const body = {
      email: userEmail,
      title: form.title.value,
      content: form.content.value,
    };
    
    try {
      const response = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setShowBlogForm(false);
      setRefresh(r => r + 1);
      form.reset();
    } catch (error) {
      console.error('Error submitting blog:', error);
      setError(`Failed to submit blog: ${error.message}`);
    }
  };

  // Handle job submission
  const handleJobSubmit = async (e: any) => {
    e.preventDefault();
    const form = e.target;
    const body = {
      email: userEmail,
      company: form.company.value,
      title: form.title.value,
    };
    
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setShowJobForm(false);
      setRefresh(r => r + 1);
      form.reset();
    } catch (error) {
      console.error('Error submitting job:', error);
      setError(`Failed to submit job: ${error.message}`);
    }
  };

  // Handle blog like
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
      
      setRefresh(r => r + 1);
    } catch (error) {
      console.error('Error liking blog:', error);
      setError(`Failed to like blog: ${error.message}`);
    }
  };

  // Handle job application
  const handleApplyJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setRefresh(r => r + 1);
    } catch (error) {
      console.error('Error applying to job:', error);
      setError(`Failed to apply to job: ${error.message}`);
    }
  };

  // Handle delete blog
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
      
      setRefresh(r => r + 1);
    } catch (error) {
      console.error('Error deleting blog:', error);
      setError(`Failed to delete blog: ${error.message}`);
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    setUserEmail(null);
    setShowEmailForm(true);
    setBlogs([]);
    setJobs([]);
  };

  // Email registration form with Tailwind styling
  if (showEmailForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome to <span className="text-purple-300 italic">Insyd</span><br/>
              Notifications
            </h1>
            <p className="text-purple-100 text-lg">
              The architecture community's notification hub
            </p>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-purple-100 mb-2">
                Email Address
              </label>
              <input 
                type="email" 
                name="email" 
                required 
                className="w-full px-4 py-3 border border-purple-300/30 rounded-lg text-white bg-white/10 backdrop-blur-sm placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                placeholder="your@email.com"
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transform transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              Join Insyd
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <main className="flex-1 p-8 relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Insyd - Architecture Social Platform
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {userEmail}</span>
            <button 
              onClick={handleLogout}
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
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Blogs</h2>
          {blogs.length === 0 ? (
            <p className="text-gray-600">No blogs yet</p>
          ) : (
            <div className="space-y-4">
              {blogs.map(blog => (
                <div key={blog.id} className="border border-gray-200 p-6 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {blog.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {blog.content}
                  </p>
                  <div className="flex justify-between items-center">
                    <small className="text-gray-500">by {blog.author.email}</small>
                    <div className="flex gap-3 items-center">
                      <button 
                        onClick={() => handleLikeBlog(blog.id)}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        👍 Like ({blog.likes || 0})
                      </button>
                      {blog.author.email === userEmail && (
                        <button 
                          onClick={() => handleDeleteBlog(blog.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Jobs Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Jobs</h2>
          {jobs.length === 0 ? (
            <p className="text-gray-600">No jobs yet</p>
          ) : (
            <div className="space-y-4">
              {jobs.map(job => (
                <div key={job.id} className="border border-gray-200 p-6 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {job.title}
                  </h3>
                  <p className="text-gray-700 mb-4">{job.company}</p>
                  <div className="flex justify-between items-center">
                    <small className="text-gray-500">by {job.author.email}</small>
                    <div className="flex gap-3 items-center">
                      {job.author.email !== userEmail && (
                        <button 
                          onClick={() => handleApplyJob(job.id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Apply
                        </button>
                      )}
                      <span className="text-sm text-gray-600">
                        {job.applications || 0} applications
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Blog Form Modal */}
        {showBlogForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <form 
              onSubmit={handleBlogSubmit} 
              className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl"
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-5">
                Create a Blog Post
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input 
                  type="text" 
                  name="title" 
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Blog title" 
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea 
                  name="content" 
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg h-32 resize-vertical focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Write your blog content..."
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="submit" 
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Post Blog
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowBlogForm(false)}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Job Form Modal */}
        {showJobForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <form 
              onSubmit={handleJobSubmit} 
              className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl"
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-5">
                Post a Job
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input 
                  type="text" 
                  name="company" 
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Job title" 
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="submit" 
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Post Job
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowJobForm(false)}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

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
      </main>
      <NotificationSidebar email={userEmail || ""} />
    </div>
  );
}
