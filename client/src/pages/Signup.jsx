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
                <input id="password" name="password" autoComplete="new-password" aria-required="true" type="password" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
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


