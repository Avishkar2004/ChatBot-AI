import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { listProjects, createProject, updateProject, deleteProject } from '../services/projects.js';
import Page from '../components/layout/Page.jsx';

const Projects = () => {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingProject, setEditingProject] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [listLoading, setListLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const load = async (forceRefresh = false) => {
    setError('');
    setListLoading(true);
    try {
      const data = await listProjects(forceRefresh);
      
      // Handle different response formats
      let projects = [];
      if (Array.isArray(data)) {
        projects = data;
      } else if (data && Array.isArray(data.projects)) {
        projects = data.projects;
      } else if (data && data.data && Array.isArray(data.data)) {
        projects = data.data;
      } else if (data && typeof data === 'object') {
        // If it's a single project object, wrap it in an array
        projects = [data];
      }
      
      setItems(projects);
    } catch (e) {
      setError(e.message || 'Failed to load projects');
      setItems([]); // Clear items on error
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      load(true); // Force refresh on mount to ensure we get latest data
    }
  }, [token]);

  // Derived: filter, sort, paginate
  const filtered = items.filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  const filteredSorted = filtered.sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name) * dir;
    }
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return (aTime - bTime) * dir;
  });

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const start = (page - 1) * pageSize;
  const paginated = filteredSorted.slice(start, start + pageSize);

  const onCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const newProject = await createProject({ name, description });
      setName('');
      setDescription('');

      // Optimistically add the new project to the list immediately
      if (newProject && newProject._id) {
        setItems((prevItems) => {
          // Check if project already exists to avoid duplicates
          const exists = prevItems.some(p => p._id === newProject._id);
          if (exists) {
            return prevItems;
          }
          return [newProject, ...prevItems];
        });
      }

      // Wait a bit for cache invalidation to complete, then force refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      await load(true); // Force refresh with cache-busting
    } catch (e) {
      setError(e.message);
      // If creation failed, reload to ensure consistency
      await load(true);
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (project) => {
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description || '');
  };

  const onUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const updatedProject = await updateProject(editingProject._id, { name, description });
      setEditingProject(null);
      setName('');
      setDescription('');

      // Optimistically update the project in the list
      if (updatedProject && updatedProject._id) {
        setItems((prevItems) =>
          prevItems.map((p) => (p._id === updatedProject._id ? updatedProject : p))
        );
      }

      // Wait a bit for cache invalidation, then force refresh
      await new Promise(resolve => setTimeout(resolve, 300));
      await load(true);
    } catch (e) {
      setError(e.message);
      await load(true);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (projectId) => {
    setLoading(true);
    setError('');
    try {
      await deleteProject(projectId);
      setShowDeleteConfirm(null);

      // Optimistically remove the project from the list
      setItems((prevItems) => prevItems.filter((p) => p._id !== projectId));

      // Wait a bit for cache invalidation, then force refresh
      await new Promise(resolve => setTimeout(resolve, 300));
      await load(true);
    } catch (e) {
      if (e?.response?.status === 404) {
        setShowDeleteConfirm(null);
        // Project already deleted, just remove from list
        setItems((prevItems) => prevItems.filter((p) => p._id !== projectId));
        await load(true);
      } else {
        setError(e.message || 'Failed to delete project');
        await load(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setError('');
  };

  return (
    <Page>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Projects</h1>
            <p className="text-gray-600 dark:text-gray-300">Create and manage your AI chatbot projects</p>
          </div>
          <button
            onClick={() => load(true)}
            disabled={listLoading}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all disabled:opacity-50 flex items-center gap-2"
            title="Refresh projects"
          >
            <svg 
              className={`w-5 h-5 ${listLoading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Toolbar: Search, Sorting, Page size */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex-1">
              <div className="relative">
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" /></svg>
                <input
                  type="text"
                  className="w-full pl-10 pr-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Search projects..."
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="updatedAt">Sort by: Last updated</option>
                <option value="name">Sort by: Name</option>
              </select>
              <select
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none"
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value)}
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
              <select
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              >
                <option value={6}>6 / page</option>
                <option value={9}>9 / page</option>
                <option value={12}>12 / page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Create/Edit Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {editingProject ? 'Edit Project' : 'Create New Project'}
          </h2>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700 dark:text-red-400 text-sm">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={editingProject ? onUpdate : onCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., Customer Support Bot"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Brief description of your project"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {editingProject ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {editingProject ? 'Update Project' : 'Create Project'}
                  </>
                )}
              </button>

              {editingProject && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex items-center justify-center px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Projects Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listLoading && (
            Array.from({ length: pageSize }).map((_, idx) => (
              <div key={`skeleton-${idx}`} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="h-5 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
                <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))
          )}
          {!listLoading && filteredSorted.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {items.length === 0 && query.trim() === '' 
                  ? 'No projects yet' 
                  : 'No projects found'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {items.length === 0 && query.trim() === ''
                  ? 'Create your first project to get started'
                  : query.trim() 
                    ? 'Try adjusting your search or create a new project'
                    : 'Try refreshing or create a new project'}
              </p>
              {items.length === 0 && query.trim() === '' && (
                <button
                  onClick={() => document.querySelector('input[type="text"]')?.focus()}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-xl hover:from-emerald-700 hover:to-blue-700 transition-all"
                >
                  Create Your First Project
                </button>
              )}
            </div>
          ) : (
            paginated.map((project) => (
              <div key={project._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{project.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{project.description || 'No description'}</p>
                    <div className="mt-2 text-xs text-gray-400">
                      <span>Updated {project.updatedAt ? new Date(project.updatedAt).toLocaleString() : '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(project)}
                      className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all duration-200"
                      title="Edit project"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(project._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                      title="Delete project"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/projects/${project._id}`}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-blue-700 transition-all duration-200 text-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Manage
                  </Link>
                  <Link
                    to={`/projects/${project._id}/chat`}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 text-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Chat
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!listLoading && filteredSorted.length > 0 && (
          <div className="flex items-center justify-between mt-6 text-sm text-gray-600 dark:text-gray-300">
            <div>
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredSorted.length)} of {filteredSorted.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50"
              >
                Prev
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Project</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete this project? All associated prompts and chat history will be permanently removed.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => onDelete(showDeleteConfirm)}
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete Project'
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
};

export default Projects;