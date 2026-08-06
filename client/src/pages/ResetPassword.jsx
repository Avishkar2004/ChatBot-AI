import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { resetPassword } from '../services/auth.js';
import { useAuth } from '../context/AuthContext.jsx';
import Page from '../components/layout/Page.jsx';
import { Button, Card, IconButton, Input, LogoMark } from '../components/ui';

/**
 * Step two: the link from the email lands here with `?token=`.
 * A successful reset signs the user straight in, so recovery ends where they
 * wanted to be rather than back at the login form.
 */
const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const token = useMemo(() => params.get('token') || '', [params]);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Both passwords must match');
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword(token, password);
      if (response?.token && response?.user) {
        login(response.token, response.user, { remember: true });
        navigate('/dashboard');
        return;
      }
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Could not reset your password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Page className="flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-[25rem] text-center">
          <LogoMark size="lg" className="mx-auto" />
          <h1 className="mt-5 font-display text-display-sm font-bold text-white">
            This link is incomplete
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Open the reset link straight from your email, or request a new one.
          </p>
          <Link to="/forgot-password" className="mt-6 inline-block">
            <Button size="lg">Request a new link</Button>
          </Link>
        </div>
      </Page>
    );
  }

  return (
    <Page className="flex items-center justify-center px-4 py-14">
      <div className="w-full max-w-[25rem]">
        <div className="mb-8 text-center">
          <LogoMark size="lg" className="mx-auto" />
          <h1 className="mt-5 font-display text-display-sm font-bold text-white">
            Choose a new password
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            This signs you out everywhere else.
          </p>
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
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="New password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              minLength={8}
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

            <Input
              id="confirm"
              name="confirm"
              type={showPassword ? 'text' : 'password'}
              label="Confirm new password"
              autoComplete="new-password"
              placeholder="Type it again"
              leftIcon={<Lock size={15} aria-hidden="true" />}
              error={confirm && confirm !== password ? 'Passwords do not match' : undefined}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-required="true"
              required
            />

            <Button type="submit" size="xl" fullWidth loading={loading} className="!mt-6">
              {loading ? 'Saving…' : 'Save new password'}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-[13px] text-slate-400">
          Remembered it?{' '}
          <Link
            to="/login"
            className="focus-ring rounded font-medium text-brand-300 transition-colors hover:text-brand-200"
          >
            Sign in
          </Link>
        </p>
      </div>
    </Page>
  );
};

export default ResetPassword;
