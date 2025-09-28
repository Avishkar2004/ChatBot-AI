import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { listProjects, createProject } from '../services/projects.js';

const Projects = () => {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const data = await listProjects();
      setItems(data);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    if (token) load();
  }, [token]);

  const onCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createProject({ name });
      setName('');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 space-y-6 min-h-screen">
      <div className="glass rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Create Project</h2>
        {error && <div className="bg-rose-500/10 text-rose-300 p-3 rounded mb-4 border border-rose-500/20">{error}</div>}
        <form onSubmit={onCreate} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input className="input sm:col-span-3" placeholder="e.g., Customer Support Bot" value={name} onChange={(e) => setName(e.target.value)} required />
          <button className="btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
        </form>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3 glass rounded-xl p-6 text-gray-400">No projects yet.</div>
        ) : (
          items.map((p) => (
            <div key={p._id} className="glass rounded-xl p-5 flex flex-col justify-between">
              <div>
                <p className="text-white font-semibold">{p.name}</p>
                <p className="text-gray-400 text-sm mt-1">{p.description || 'No description'}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <Link to={`/projects/${p._id}`} className="btn-primary">Manage</Link>
                <Link to={`/projects/${p._id}/chat`} className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-gray-200 hover:text-white hover:bg-white/5 border border-white/10">Chat</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Projects;