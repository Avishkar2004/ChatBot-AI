import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getProject, listPrompts, createPrompt } from '../services/projects.js';
import Page from '../components/layout/Page.jsx';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const { token } = useAuth();
  const [project, setProject] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedPromptId, setCopiedPromptId] = useState(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest | oldest | az | za
  const [expandedPromptId, setExpandedPromptId] = useState(null);

  const TITLE_MAX = 60;
  const CONTENT_MAX = 600;

  const load = useCallback(async () => {
    setError('');
    setIsLoading(true);
    try {
      const p = await getProject(projectId);
      setProject(p);
      const pr = await listPrompts(projectId);
      setPrompts(pr);
    } catch (e) {
      setError(e.message || 'Failed to load project');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => { if (token) load(); }, [token, load]);

  const onCreatePrompt = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    // Clear previous errors
    setError('');

    // Validation
    if (!trimmedTitle) {
      setError('Please enter a title for your prompt.');
      return;
    }
    if (!trimmedContent) {
      setError('Please enter content for your prompt.');
      return;
    }
    if (trimmedTitle.length > TITLE_MAX) {
      setError(`Title must be ${TITLE_MAX} characters or less.`);
      return;
    }
    if (trimmedContent.length > CONTENT_MAX) {
      setError(`Content must be ${CONTENT_MAX} characters or less.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await createPrompt(projectId, { title: trimmedTitle, content: trimmedContent });
      setTitle('');
      setContent('');
      setSuccess('Prompt created successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await load();
    } catch (e) {
      setError(e.message || 'Failed to create prompt. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPrompt = async (promptId, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPromptId(promptId);
      setTimeout(() => setCopiedPromptId(null), 1200);
    } catch (_) {
      // noop
    }
  };

  // no-op retained previously; removed to satisfy linter

  const normalized = (s) => (s || '').toLowerCase();

  const visiblePrompts = prompts
    .filter((p) => {
      const q = normalized(filterQuery);
      if (!q) return true;
      return normalized(p.title).includes(q) || normalized(p.content).includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortBy === 'az') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'za') return (b.title || '').localeCompare(a.title || '');
      return 0;
    });

  return (
    <Page>
      <div className="max-w-5xl mx-auto pt-10 pb-16 px-4 space-y-8">
        {/* Project Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden">
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{project?.name || 'Project'}</h2>
                <p className="text-gray-600 dark:text-gray-400">{project?.description || 'No description provided.'}</p>
              </div>
              <div className="flex-shrink-0">
                <Link
                  to={`/projects/${projectId}/chat`}
                  className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-blue-700 transition duration-200 shadow-md hover:shadow-lg"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Open Chat
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Prompts Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-md">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Prompts</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Create reusable instructions your agent can reference.
            </p>
          </div>
          {/* Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <div className="relative flex-1">
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search prompts by title or content"
                className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <svg className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
            </div>
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="az">Title A–Z</option>
                <option value="za">Title Z–A</option>
              </select>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-4 rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-4 py-3 text-sm flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-4 py-3 text-sm flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Create Prompt Form */}
          <form onSubmit={onCreatePrompt} className="space-y-4 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Title Field */}
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Greeting"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
                  required
                  disabled={isSubmitting || isLoading}
                  className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Short, descriptive name</span>
                  <span className="text-xs text-gray-400">{title.length}/{TITLE_MAX}</span>
                </div>
              </div>

              {/* Content Field */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content
                </label>
                <textarea
                  rows="4"
                  placeholder="Write your prompt content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, CONTENT_MAX))}
                  required
                  disabled={isSubmitting || isLoading}
                  className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition resize-none"
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Use clear, directive language. You can reference variables like {"{userName}"}.
                  </p>
                  <span className="text-xs text-gray-400">{content.length}/{CONTENT_MAX}</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setTitle('');
                  setContent('');
                  setError('');
                  setSuccess('');
                }}
                disabled={isSubmitting || isLoading}
                className="inline-flex items-center justify-center px-4 py-2.5 text-gray-700 dark:text-gray-300 font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isLoading || !title.trim() || !content.trim()}
                className="inline-flex items-center justify-center px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6" />
                    </svg>
                    Add Prompt
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Prompt List */}
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                  <div className="animate-pulse">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                    <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : prompts.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-12 text-center border border-dashed border-gray-300 dark:border-gray-600">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-600">
                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No prompts yet</h3>
              <p className="text-gray-600 dark:text-gray-400">Create your first prompt above to get started.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visiblePrompts.map((pr) => (
                <div key={pr._id} className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-200">
                  <div className="p-6">
                    {/* Copy Button */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleCopyPrompt(pr._id, pr.content)}
                        className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors"
                      >
                        {copiedPromptId === pr._id ? (
                          <>
                            <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                            </svg>
                            Copy
                          </>
                        )}
                      </button>
                    </div>

                    {/* Prompt Content */}
                    <div className="pr-16">
                      <h4 className="text-gray-900 dark:text-white font-semibold text-base mb-3 line-clamp-1">
                        {pr.title}
                      </h4>
                      <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                        <p className="whitespace-pre-line line-clamp-4">
                          {expandedPromptId === pr._id ? pr.content : (pr.content?.length > 200 ? pr.content.slice(0, 200) + '…' : pr.content)}
                        </p>
                        {pr.content && pr.content.length > 200 && (
                          <button
                            type="button"
                            onClick={() => setExpandedPromptId(expandedPromptId === pr._id ? null : pr._id)}
                            className="mt-2 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline transition-colors"
                          >
                            {expandedPromptId === pr._id ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Page>
  );
};

export default ProjectDetail;
