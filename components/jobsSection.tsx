'use client';

interface Job {
  id: string;
  title: string;
  company: string;
  author: { email: string };
  createdAt: string;
  applications: number;
  hasApplied?: boolean;
}

interface JobsSectionProps {
  jobs: Job[];
  userEmail: string;
  onApplyJob: (jobId: string) => void;
  onDeleteJob: (jobId: string) => void;
}

export default function JobsSection({ jobs, userEmail, onApplyJob, onDeleteJob }: JobsSectionProps) {
  return (
    <div className="mb-16">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Jobs</h2>
      {jobs.length === 0 ? (
        <p className="text-gray-600">No jobs yet</p>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job.id} className="border border-gray-200 p-6 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-xl font-semibold text-gray-900">
                  {job.title}
                </h3>
                <span className="text-sm text-gray-500">
                  by {job.author.email}
                </span>
              </div>
              <p className="text-gray-700 mb-4 font-medium">{job.company}</p>
              <div className="flex justify-between items-center">
                <small className="text-gray-500">
                  {new Date(job.createdAt).toLocaleDateString()}
                </small>
                <div className="flex gap-3 items-center">
                  {job.author.email !== userEmail && (
                    <button 
                      onClick={() => !job.hasApplied && onApplyJob(job.id)}
                      disabled={job.hasApplied}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        job.hasApplied
                          ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {job.hasApplied ? 'Applied' : 'Apply'}
                    </button>
                  )}
                  {job.author.email === userEmail && (
                    <button 
                      onClick={() => onDeleteJob(job.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                    >
                      Delete
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
  );
}