import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register as apiRegister } from '../services/auth.js';
import { useAuth } from '../context/AuthContext.jsx';
import Page from '../components/layout/Page.jsx';
import Container from '../components/ui/Container.jsx';

// Password strength calculator
const calculatePasswordStrength = (password) => {
  if (!password) return { strength: 0, label: '', color: '' };
  
  let strength = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };

  strength = Object.values(checks).filter(Boolean).length;

  if (strength <= 2) {
    return { strength, label: 'Weak', color: 'bg-red-500' };
  } else if (strength === 3) {
    return { strength, label: 'Fair', color: 'bg-yellow-500' };
  } else if (strength === 4) {
    return { strength, label: 'Good', color: 'bg-blue-500' };
  } else {
    return { strength, label: 'Strong', color: 'bg-emerald-500' };
  }
};

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordStrength = useMemo(() => calculatePasswordStrength(password), [password]);

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
        <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create your account</h1>
              <p className="text-gray-600 dark:text-gray-400">Start building intelligent AI agents today</p>
            </div>

            {/* Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-5" noValidate>
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="username">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      id="username"
                      name="username"
                      autoComplete="username"
                      aria-required="true"
                      type="text"
                      placeholder="johndoe"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="email">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      name="email"
                      autoComplete="email"
                      inputMode="email"
                      aria-required="true"
                      aria-invalid={!!error}
                      type="email"
                      placeholder="john@example.com"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      autoComplete="new-password"
                      aria-required="true"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
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

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Password strength:</span>
                        <span className={`font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${passwordStrength.color} transition-all duration-300 ease-out`}
                          style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <div className={`flex items-center gap-1.5 ${password.length >= 8 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                          <svg className={`w-4 h-4 ${password.length >= 8 ? '' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {password.length >= 8 ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            )}
                          </svg>
                          <span>8+ characters</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(password) ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                          <svg className={`w-4 h-4 ${/[A-Z]/.test(password) ? '' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {/[A-Z]/.test(password) ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            )}
                          </svg>
                          <span>Uppercase</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${/[0-9]/.test(password) ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                          <svg className={`w-4 h-4 ${/[0-9]/.test(password) ? '' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {/[0-9]/.test(password) ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            )}
                          </svg>
                          <span>Number</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${/[^a-zA-Z0-9]/.test(password) ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                          <svg className={`w-4 h-4 ${/[^a-zA-Z0-9]/.test(password) ? '' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {/[^a-zA-Z0-9]/.test(password) ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            )}
                          </svg>
                          <span>Special char</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating account...
                    </>
                  ) : (
                    'Create account'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-emerald-600 dark:text-emerald-400 hover:opacity-80 transition">
                    Log in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Page>
  );
};

export default Signup;


