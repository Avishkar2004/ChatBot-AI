import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register as apiRegister } from '../services/auth.js';
import { useAuth } from '../context/AuthContext.jsx';

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await apiRegister(email, password);
      login(token, user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full mx-auto glass rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4 text-white">Create an account</h2>
        {error && <div className="bg-rose-500/10 text-rose-300 p-3 rounded mb-4 border border-rose-500/20">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm text-gray-300 mb-1" htmlFor="email">Email</label>
            <input id="email" name="email" autoComplete="email" inputMode="email" aria-required="true" aria-invalid={!!error} type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1" htmlFor="password">Password</label>
            <input id="password" name="password" autoComplete="new-password" aria-required="true" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p className="text-sm text-gray-400 mt-4">Already have an account? <Link to="/login" className="text-emerald-400 hover:text-emerald-300">Log in</Link></p>
      </div>
    </div>
  );
};

export default Signup;


