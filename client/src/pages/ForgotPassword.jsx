import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Mail, MailCheck } from 'lucide-react';
import { requestPasswordReset } from '../services/auth.js';
import Page from '../components/layout/Page.jsx';
import { Button, Card, Input, LogoMark } from '../components/ui';

/**
 * Step one of password recovery.
 *
 * The confirmation is deliberately identical whether or not the address has an
 * account — otherwise this page becomes a way to check who is registered.
 */
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  // Only ever populated when the server has no mail provider and is not in
  // production. Saves copying a token out of a server log by hand.
  const [devLink, setDevLink] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await requestPasswordReset(email);
      setDevLink(response?.resetUrl || '');
      setSent(true);
    } catch (err) {
      setError(err.message || 'Could not send the reset email. Please try again.');
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
            {sent ? 'Check your email' : 'Reset your password'}
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            {sent
              ? 'If an account exists for that address, a reset link is on its way.'
              : "Enter your email and we'll send you a link to choose a new one."}
          </p>
        </div>

        <Card variant="elevated" padding="lg">
          {sent ? (
            <div className="flex flex-col items-center text-center">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-500/10 text-emerald-400">
                <MailCheck size={20} aria-hidden="true" />
              </span>
              <p className="mt-4 text-[13px] leading-relaxed text-slate-400">
                The link expires in 60 minutes. Nothing arrived? Check spam, then
                try again with a different address.
              </p>

              {devLink && (
                <div className="mt-5 w-full rounded-lg border border-amber-500/25 bg-amber-500/10 p-3.5 text-left">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-amber-300">
                    Development mode
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-amber-100/80">
                    No mail provider is configured, so nothing was actually sent.
                    Use this link directly:
                  </p>
                  <a
                    href={devLink}
                    className="focus-ring mt-2.5 inline-block break-all rounded text-[13px] font-medium text-brand-300 underline underline-offset-4 hover:text-brand-200"
                  >
                    Open the reset link
                  </a>
                </div>
              )}

              <Button
                variant="ghost"
                size="lg"
                fullWidth
                className="mt-5"
                onClick={() => {
                  setSent(false);
                  setDevLink('');
                  setEmail('');
                }}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <>
              {error && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3.5 py-3"
                >
                  <AlertCircle
                    size={16}
                    className="mt-px shrink-0 text-rose-400"
                    aria-hidden="true"
                  />
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

                <Button type="submit" size="xl" fullWidth loading={loading} className="!mt-6">
                  {loading ? 'Sending…' : 'Send reset link'}
                </Button>
              </form>
            </>
          )}
        </Card>

        <p className="mt-6 text-center text-[13px] text-slate-400">
          <Link
            to="/login"
            className="focus-ring inline-flex items-center gap-1.5 rounded font-medium text-brand-300 transition-colors hover:text-brand-200"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to sign in
          </Link>
        </p>
      </div>
    </Page>
  );
};

export default ForgotPassword;
