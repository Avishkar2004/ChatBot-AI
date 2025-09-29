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
    if (!trimmedTitle || !trimmedContent) {
      setError('Please fill in both title and content.');
      return;
    }
    if (trimmedTitle.length > TITLE_MAX || trimmedContent.length > CONTENT_MAX) {
      setError('One or more fields exceed the character limit.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await createPrompt(projectId, { title: trimmedTitle, content: trimmedContent });
      setTitle('');
      setContent('');
      await load();
    } catch (e) {
      setError(e.message || 'Failed to create prompt');
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
              <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-80 bg-gray-200 dark:bg-gray-700 rounded mt-3"></div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{project?.name || 'Project'}</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{project?.description || 'No description provided.'}</p>
              </div>
              <Link
                to={`/projects/${projectId}/chat`}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-blue-700 transition duration-200 text-sm shadow-md"
              >
                Open Chat
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
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

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Create Prompt Form */}
          <form onSubmit={onCreatePrompt} className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-5 items-start">
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input
                type="text"
                placeholder="e.g., Greeting"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
                required
                disabled={isSubmitting || isLoading}
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Short, descriptive name</span>
                <span className="text-xs text-gray-400">{title.length}/{TITLE_MAX}</span>
              </div>
            </div>
            {/* Content Field */}
            <div className="md:col-span-7">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content
              </label>
              <div className="relative">
                <textarea
                  rows="5"
                  placeholder="Write your prompt content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, CONTENT_MAX))}
                  required
                  disabled={isSubmitting || isLoading}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Use clear, directive language. You can reference variables like {"{userName}"}.
              </p>
              <div className="mt-1 text-right text-xs text-gray-400">{content.length}/{CONTENT_MAX}</div>
            </div>

            {/* Add Button */}
            <div className="md:col-span-1 flex md:items-end md:justify-end md:self-end">
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full md:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 active:scale-[0.99] transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
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
            <div className="grid sm:grid-cols-2 gap-4">
              {[1,2,3,4].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow">
                  <div className="animate-pulse">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded mt-3"></div>
                    <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-700 rounded mt-2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : prompts.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-10 text-center border border-dashed border-gray-300 dark:border-gray-600">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600">
                <svg className="w-6 h-6 text-gray-500 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400">No prompts yet. Create your first one above.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {visiblePrompts.map((pr) => (
                <div key={pr._id} className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:ring-1 hover:ring-emerald-500/30 transition">
                  <div className="p-5">
                    <div className="absolute top-3 right-3">
                      <button
                        type="button"
                        onClick={() => handleCopyPrompt(pr._id, pr.content)}
                        className="inline-flex items-center px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {copiedPromptId === pr._id ? (
                          <>
                            <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Copied
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                            </svg>
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-gray-900 dark:text-white font-semibold pr-20">{pr.title}</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 whitespace-pre-line">
                      {expandedPromptId === pr._id ? pr.content : (pr.content?.length > 240 ? pr.content.slice(0, 240) + '…' : pr.content)}
                    </p>
                    {pr.content && pr.content.length > 240 && (
                      <button
                        type="button"
                        onClick={() => setExpandedPromptId(expandedPromptId === pr._id ? null : pr._id)}
                        className="mt-3 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                      >
                        {expandedPromptId === pr._id ? 'Show less' : 'Show more'}
                      </button>
                    )}
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
