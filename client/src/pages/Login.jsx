import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { login as apiLogin } from '../services/auth.js';
import { useAuth } from '../context/AuthContext.jsx';
import Page from '../components/layout/Page.jsx';
import { Button, Card, IconButton, Input, LogoMark } from '../components/ui';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    // Very light client email format check before request
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Valid email is required');
      setLoading(false);
      return;
    }

    try {
      const response = await apiLogin(email, password);

      // Validate response structure
      if (!response.token || !response.user) {
        throw new Error('Invalid response from server');
      }

      // `remember` decides whether the session survives closing the tab.
      login(response.token, response.user, { remember });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page className="flex items-center justify-center px-4 py-14">
      <div className="w-full max-w-[25rem]">
        <div className="mb-8 text-center">
          <LogoMark size="lg" className="mx-auto" />
          <h1 className="mt-5 font-display text-display-sm font-bold text-white">Welcome back</h1>
          <p className="mt-1.5 text-sm text-slate-400">Sign in to continue to your account</p>
        </div>

        <Card variant="elevated" padding="lg">
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3.5 py-3"
            >
              <AlertCircle size={16} className="mt-px shrink-0 text-rose-400" aria-hidden="true" />
              <p className="text-[13px] leading-relaxed text-rose-200">{error}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Input
              id="email"
              name="email"
              type="email"
              label="Email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@company.com"
              leftIcon={<Mail size={15} aria-hidden="true" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-required="true"
              required
            />

            <div>
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                autoComplete="current-password"
                placeholder="Enter your password"
                leftIcon={<Lock size={15} aria-hidden="true" />}
                rightIcon={
                  <IconButton
                    size="sm"
                    tooltip={false}
                    label={showPassword ? 'Hide password' : 'Show password'}
                    icon={showPassword ? EyeOff : Eye}
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  />
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-required="true"
                required
              />

              <div className="mt-3 flex items-center justify-between">
                <label
                  htmlFor="remember"
                  className="flex cursor-pointer select-none items-center gap-2 text-[13px] text-slate-400"
                >
                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-3.5 w-3.5 cursor-pointer rounded border-line bg-surface-muted text-brand-500 focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-0"
                  />
                  Keep me signed in
                </label>
                <Link
                  to="/forgot-password"
                  className="focus-ring rounded text-[13px] font-medium text-brand-300 transition-colors hover:text-brand-200"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button type="submit" size="xl" fullWidth loading={loading} className="!mt-6">
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-[13px] text-slate-400">
          Don&apos;t have an account?{' '}
          <Link
            to="/signup"
            className="focus-ring rounded font-medium text-brand-300 transition-colors hover:text-brand-200"
          >
            Sign up
          </Link>
        </p>
      </div>
    </Page>
  );
};

export default Login;
