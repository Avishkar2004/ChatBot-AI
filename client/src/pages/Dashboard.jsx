import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchMe } from '../services/auth.js';

const Dashboard = () => {
  const { token, user } = useAuth();
  const [serverUser, setServerUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await fetchMe(token);
        setServerUser(data.user);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) run();
  }, [token]);

  return (
    <div className="min-h-screen max-w-6xl mx-auto pt-10 pb-16 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Welcome back</h2>
          <p className="text-gray-300 mt-1">{user?.email}</p>
        </div>
        <div className="hidden sm:flex gap-3">
          <a href="/projects" className="btn-primary">View Projects</a>
          <a href="/projects" className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-gray-200 hover:text-white hover:bg-white/5 border border-white/10">Create Project</a>
        </div>
      </div>

      {error && <div className="glass rounded-xl p-4 text-amber-300 border border-amber-500/20">{error}</div>}

      {/* Overview cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-5">
          <p className="text-gray-400 text-sm">Projects</p>
          <p className="text-2xl font-semibold text-white mt-1">—</p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-gray-400 text-sm">Prompts</p>
          <p className="text-2xl font-semibold text-white mt-1">—</p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-gray-400 text-sm">Active Model</p>
          <p className="text-2xl font-semibold text-white mt-1">{process.env.REACT_APP_MODEL_NAME || 'Groq (configured)'}</p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-gray-400 text-sm">Status</p>
          <p className="text-2xl font-semibold text-white mt-1">Online</p>
        </div>
      </div>

      {/* Main panels */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white">Quick start</h3>
            <div className="mt-4 grid sm:grid-cols-3 gap-3">
              <Link to="/projects" className="btn-primary">Create a Project</Link>
              <Link to="/projects" className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-gray-200 hover:text-white hover:bg-white/5 border border-white/10">Manage Prompts</Link>
              <Link to="/projects" className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-gray-200 hover:text-white hover:bg-white/5 border border-white/10">Open Chat</Link>
            </div>
          </div>

          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white">Account data</h3>
            {loading ? (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg h-14 animate-pulse" />
                <div className="bg-white/5 rounded-lg h-14 animate-pulse" />
                <div className="bg-white/5 rounded-lg h-14 animate-pulse sm:col-span-2" />
              </div>
            ) : serverUser ? (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-black/30 border border-white/10 rounded-lg p-4">
                  <p className="text-xs text-gray-400">User ID</p>
                  <p className="text-sm text-gray-100 break-all">{serverUser.id || serverUser._id}</p>
                </div>
                <div className="bg-black/30 border border-white/10 rounded-lg p-4">
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm text-gray-100 break-all">{serverUser.email}</p>
                </div>
                <div className="bg-black/30 border border-white/10 rounded-lg p-4 sm:col-span-2">
                  <p className="text-xs text-gray-400">Raw</p>
                  <pre className="text-xs text-gray-200 overflow-auto">{JSON.stringify(serverUser, null, 2)}</pre>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-gray-400">No account data available.</p>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white">Resources</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><a href="/" className="text-emerald-400 hover:text-emerald-300">API Docs</a></li>
              <li><a href="/" className="text-emerald-400 hover:text-emerald-300">Styling Guide</a></li>
              <li><a href="/" className="text-emerald-400 hover:text-emerald-300">Support</a></li>
            </ul>
          </div>

          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white">Environment</h3>
            <p className="text-gray-300 mt-2">Client URL: <span className="text-gray-400">{window.location.origin}</span></p>
            <p className="text-gray-300 mt-1">API Base: <span className="text-gray-400">{process.env.REACT_APP_API_BASE || 'http://localhost:8000'}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
