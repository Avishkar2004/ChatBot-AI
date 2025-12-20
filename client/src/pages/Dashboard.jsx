import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchMe } from '../services/auth.js';
import Page from '../components/layout/Page.jsx';
import Container from '../components/ui/Container.jsx';

const Dashboard = () => {
  const { token, user } = useAuth();
  const [serverUser, setServerUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await fetchMe();
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
    <Page>
      <Container>
      {/* Header */}
        <div className="flex items-center justify-between pt-10 pb-6">
        <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {user?.username || user?.email}</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">{user?.email}</p>
        </div>
        <div className="hidden sm:flex gap-3">
            <a href="/projects" className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:from-emerald-700 hover:to-blue-700 transition-all duration-200">View Projects</a>
            <a href="/projects" className="inline-flex items-center rounded-xl px-6 py-3 text-sm font-medium bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">Create Project</a>
          </div>
        </div>

        {error && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-amber-800 dark:text-amber-300 mb-6">
            {error}
      </div>
        )}

      {/* Overview cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-lg">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Projects</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">—</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-lg">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Prompts</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">—</p>
        </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-lg">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Active Model</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{process.env.REACT_APP_MODEL_NAME || 'Groq (configured)'}</p>
        </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-lg">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Status</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">Online</p>
        </div>
      </div>

      {/* Main panels */}
        <div className="grid lg:grid-cols-3 gap-4 pb-16">
        <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick start</h3>
            <div className="mt-4 grid sm:grid-cols-3 gap-3">
                <Link to="/projects" className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-blue-700 transition-all duration-200 text-sm">Create a Project</Link>
                <Link to="/projects" className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">Manage Prompts</Link>
                <Link to="/projects" className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">Open Chat</Link>
            </div>
          </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Account data</h3>
            {loading ? (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-14 animate-pulse" />
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-14 animate-pulse" />
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-14 animate-pulse sm:col-span-2" />
              </div>
            ) : serverUser ? (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">User ID</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 break-all">{serverUser.id || serverUser._id}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Username</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 break-all">{serverUser.username || 'N/A'}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 break-all">{serverUser.email}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">Active</p>
                </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:col-span-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Raw Data</p>
                    <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-auto">{JSON.stringify(serverUser, null, 2)}</pre>
                </div>
              </div>
            ) : (
                <p className="mt-3 text-gray-600 dark:text-gray-400">No account data available.</p>
            )}
          </div>
        </div>
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resources</h3>
            <ul className="mt-3 space-y-2 text-sm">
                <li><a href="/" className="text-emerald-600 dark:text-emerald-400 hover:opacity-80">API Docs</a></li>
                <li><a href="/" className="text-emerald-600 dark:text-emerald-400 hover:opacity-80">Styling Guide</a></li>
                <li><a href="/" className="text-emerald-600 dark:text-emerald-400 hover:opacity-80">Support</a></li>
            </ul>
          </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Environment</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Client URL: <span className="text-gray-500 dark:text-gray-400">{window.location.origin}</span></p>
              <p className="text-gray-600 dark:text-gray-300 mt-1">API Base: <span className="text-gray-500 dark:text-gray-400">{process.env.REACT_APP_API_BASE || 'http://localhost:8080'}</span></p>
            </div>
          </div>
        </div>
      </Container>
    </Page>
  );
};

export default Dashboard;
