import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register as apiRegister } from '../services/auth.js';
import { useAuth } from '../context/AuthContext.jsx';
import Page from '../components/layout/Page.jsx';
import Container from '../components/ui/Container.jsx';

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!username || !email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      setLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await apiRegister(username, email, password);

      // Validate response structure
      if (!response.token || !response.user) {
        throw new Error('Invalid response from server');
      }

      login(response.token, response.user);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <Container>
        <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center py-12">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Create an account</h2>
            {error && <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 p-3 rounded mb-4 border border-rose-200 dark:border-rose-800">{error}</div>}
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1" htmlFor="username">Username</label>
                <input id="username" name="username" autoComplete="username" aria-required="true" type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1" htmlFor="email">Email</label>
                <input id="email" name="email" autoComplete="email" inputMode="email" aria-required="true" aria-invalid={!!error} type="email" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1" htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    autoComplete="new-password"
                    aria-required="true"
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7 0-1.063.39-2.207 1.05-3.3M6.18 6.18C7.86 5.14 9.86 4.5 12 4.5c5 0 9 4 9 7 0 1.034-.375 2.145-1.02 3.22M3 3l18 18M9.88 9.88A3 3 0 1114.12 14.1" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <button disabled={loading} className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-blue-700 transition-all duration-200 shadow-lg w-full disabled:opacity-50">
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">Already have an account? <Link to="/login" className="text-emerald-600 dark:text-emerald-400 hover:opacity-80">Log in</Link></p>
          </div>
        </div>
      </Container>
    </Page>
  );
};

export default Signup;


