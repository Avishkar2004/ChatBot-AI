import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, AtSign, Check, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { register as apiRegister } from '../services/auth.js';
import { useAuth } from '../context/AuthContext.jsx';
import Page from '../components/layout/Page.jsx';
import { Button, Card, IconButton, Input, LogoMark, cn } from '../components/ui';

/**
 * Requirements are declared once and drive both the score and the checklist,
 * so the two can never disagree.
 */
const REQUIREMENTS = [
  { id: 'length', label: '8+ characters', test: (p) => p.length >= 8 },
  { id: 'uppercase', label: 'Uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'number', label: 'Number', test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'Special character', test: (p) => /[^a-zA-Z0-9]/.test(p) },
  { id: 'lowercase', label: 'Lowercase letter', test: (p) => /[a-z]/.test(p) },
];

// Scored on the same 0–5 scale as before; only the colours moved onto tokens.
const TIERS = [
  { min: 0, label: '', bar: '', text: '' },
  { min: 1, label: 'Weak', bar: 'bg-rose-500', text: 'text-rose-400' },
  { min: 3, label: 'Fair', bar: 'bg-amber-500', text: 'text-amber-400' },
  { min: 4, label: 'Good', bar: 'bg-brand-500', text: 'text-brand-300' },
  { min: 5, label: 'Strong', bar: 'bg-emerald-500', text: 'text-emerald-400' },
];

const calculatePasswordStrength = (password) => {
  if (!password) return { strength: 0, ...TIERS[0] };
  const strength = REQUIREMENTS.filter((r) => r.test(password)).length;
  const tier = [...TIERS].reverse().find((t) => strength >= t.min) || TIERS[0];
  return { strength, ...tier };
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
    <Page className="flex items-center justify-center px-4 py-14">
      <div className="w-full max-w-[25rem]">
        <div className="mb-8 text-center">
          <LogoMark size="lg" className="mx-auto" />
          <h1 className="mt-5 font-display text-display-sm font-bold text-white">
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">Start building AI agents today</p>
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
              id="username"
              name="username"
              type="text"
              label="Username"
              autoComplete="username"
              placeholder="johndoe"
              leftIcon={<AtSign size={15} aria-hidden="true" />}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-required="true"
              required
            />

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
                autoComplete="new-password"
                placeholder="Create a strong password"
                minLength={6}
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

              {password && <PasswordStrength password={password} tier={passwordStrength} />}
            </div>

            <Button type="submit" size="xl" fullWidth loading={loading} className="!mt-6">
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-[13px] text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="focus-ring rounded font-medium text-brand-300 transition-colors hover:text-brand-200"
          >
            Log in
          </Link>
        </p>
      </div>
    </Page>
  );
};

/**
 * Four segments rather than one continuous bar: discrete steps make the jump
 * between tiers legible without animating a width.
 */
function PasswordStrength({ password, tier }) {
  const filled = Math.min(4, Math.max(0, tier.strength - 1));

  return (
    <div className="mt-3.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Password strength</span>
        <span className={cn('text-xs font-medium', tier.text)}>{tier.label}</span>
      </div>

      <div className="mt-1.5 flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              i < filled ? tier.bar : 'bg-white/[0.08]'
            )}
          />
        ))}
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {REQUIREMENTS.slice(0, 4).map((req) => {
          const met = req.test(password);
          return (
            <li
              key={req.id}
              className={cn(
                'flex items-center gap-1.5 text-xs transition-colors',
                met ? 'text-slate-300' : 'text-slate-600'
              )}
            >
              <Check
                size={12}
                strokeWidth={3}
                aria-hidden="true"
                className={cn('shrink-0', met ? 'text-emerald-400' : 'text-slate-700')}
              />
              {req.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Signup;
