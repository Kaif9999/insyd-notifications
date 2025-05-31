'use client';

interface Blog {
  id: string;
  title: string;
  content: string;
  author: { email: string };
  createdAt: string;
  likes: number;
}

interface BlogsSectionProps {
  blogs: Blog[];
  userEmail: string;
  onLikeBlog: (blogId: string) => void;
  onDeleteBlog: (blogId: string) => void;
}

export default function BlogsSection({ blogs, userEmail, onLikeBlog, onDeleteBlog }: BlogsSectionProps) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Blogs</h2>
      {blogs.length === 0 ? (
        <p className="text-gray-600">No blogs yet</p>
      ) : (
        <div className="space-y-4">
          {blogs.map(blog => (
            <div key={blog.id} className="border border-gray-200 p-6 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {blog.title}
                </h3>
                <span className="text-sm text-gray-500">
                  by {blog.author.email}
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                {blog.content}
              </p>
              <div className="flex justify-between items-center">
                <small className="text-gray-500">
                  {new Date(blog.createdAt).toLocaleDateString()}
                </small>
                <div className="flex gap-3 items-center">
                  <button 
                    onClick={() => onLikeBlog(blog.id)}
                    className="text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    👍 Like ({blog.likes || 0})
                  </button>
                  {blog.author.email === userEmail && (
                    <button 
                      onClick={() => onDeleteBlog(blog.id)}
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
  );
}