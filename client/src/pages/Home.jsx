import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, MessageSquare, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Features from '../components/Features.jsx';
import { Button, Container, LogoMark, Spinner } from '../components/ui';

const guarantees = ['No credit card required', 'Free forever plan'];

function Home() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Spinner size="md" className="text-brand-400" label="Loading" />
      </div>
    );
  }

  return (
    <div>
      <section className="relative">
        <Container className="pb-16 pt-20 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-3 py-1 text-xs font-medium text-slate-300">
              <Sparkles size={13} className="text-brand-400" aria-hidden="true" />
              Streaming responses, reusable prompts, per-project memory
            </p>

            <h1 className="mt-6 font-display text-display-lg font-bold text-white sm:text-display-xl">
              {isAuthenticated ? (
                <>
                  Welcome back,{' '}
                  <span className="text-gradient-brand">{user?.username || user?.email}</span>
                </>
              ) : (
                <>
                  Build AI agents
                  <br className="hidden sm:block" /> worth shipping
                </>
              )}
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
              {isAuthenticated
                ? 'Pick up where you left off, or start a new project and give it a set of prompts to work from.'
                : 'Organise agents into projects, give each one a library of prompts, and iterate on the conversation until it behaves the way you need.'}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {isAuthenticated ? (
                <>
                  <Button as={Link} to="/projects" size="xl" rightIcon={<ArrowRight size={16} />}>
                    Go to projects
                  </Button>
                  <Button as={Link} to="/dashboard" size="xl" variant="secondary">
                    View dashboard
                  </Button>
                </>
              ) : (
                <>
                  <Button as={Link} to="/signup" size="xl" rightIcon={<ArrowRight size={16} />}>
                    Start building free
                  </Button>
                  <Button as={Link} to="/login" size="xl" variant="secondary">
                    Sign in
                  </Button>
                </>
              )}
            </div>

            {!isAuthenticated && (
              <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                {guarantees.map((text) => (
                  <li key={text} className="flex items-center gap-1.5 text-[13px] text-slate-500">
                    <Check size={14} className="text-emerald-400" aria-hidden="true" />
                    {text}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <ProductPreview />
        </Container>
      </section>

      <Features />

      {!isAuthenticated && (
        <section className="pb-8">
          <Container>
            <div className="relative overflow-hidden rounded-2xl border border-line bg-surface-raised px-6 py-14 text-center shadow-floating sm:px-12">
              {/* One soft wash instead of three animated orbs. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(99,102,241,0.14),transparent_70%)]"
              />
              <div className="relative">
                <h2 className="font-display text-display-sm font-bold text-white sm:text-display">
                  Start building in under a minute
                </h2>
                <p className="mx-auto mt-3.5 max-w-lg text-[15px] leading-relaxed text-slate-400">
                  Create a project, write your first prompt, and open the chat. No setup, no
                  configuration files.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button as={Link} to="/signup" size="xl" rightIcon={<ArrowRight size={16} />}>
                    Create free account
                  </Button>
                  <Button as={Link} to="/login" size="xl" variant="secondary">
                    Sign in
                  </Button>
                </div>
              </div>
            </div>
          </Container>
        </section>
      )}
    </div>
  );
}

/**
 * A static, honest depiction of the actual chat view — same surfaces, same
 * bubble treatment, same header. The previous version was a fake macOS window
 * with pulsing traffic lights and a perpetual "AI is typing…", which promised
 * an interface the product doesn't have.
 */
function ProductPreview() {
  return (
    <div className="relative mx-auto mt-16 max-w-4xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-8 -top-8 bottom-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(99,102,241,0.12),transparent_70%)]"
      />
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface-raised shadow-overlay">
        <div className="flex items-center gap-2.5 border-b border-line bg-white/[0.02] px-4 py-3">
          <LogoMark size="sm" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-white">Support Assistant</p>
            <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Connected
            </p>
          </div>
          <span className="ml-auto hidden items-center gap-1.5 rounded-md border border-line px-2 py-1 text-[11px] font-medium text-slate-400 sm:inline-flex">
            <MessageSquare size={11} aria-hidden="true" />4 prompts active
          </span>
        </div>

        <div className="space-y-5 px-4 py-6 sm:px-8 sm:py-8">
          <div className="flex justify-end">
            <p className="max-w-[80%] rounded-2xl rounded-br-md bg-brand-600 px-4 py-2.5 text-sm leading-relaxed text-white">
              A customer says their export finished but the file is empty. What should I check?
            </p>
          </div>

          <div className="flex gap-3">
            <LogoMark size="sm" className="mt-0.5" />
            <div className="min-w-0 max-w-[85%] rounded-2xl rounded-bl-md border border-line bg-white/[0.03] px-4 py-3">
              <div className="markdown">
                <p>Three things, in order of likelihood:</p>
                <ol>
                  <li>
                    The export ran against an empty filter — check <code>rows_written</code> in the
                    job log.
                  </li>
                  <li>The job timed out after the header was flushed.</li>
                  <li>Permissions dropped mid-run, so writes silently no-oped.</li>
                </ol>
                <p className="!mb-0">
                  Ask them for the job ID and I&apos;ll narrow it down
                  <span
                    aria-hidden="true"
                    className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] animate-caret rounded-sm bg-brand-400"
                  />
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fades the transcript into the composer so the panel reads as a
            cropped view of a longer conversation. */}
        <div className="border-t border-line bg-surface-sunken/50 px-4 py-3.5 sm:px-8">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-muted/50 px-3.5 py-2.5">
            <span className="flex-1 truncate text-sm text-slate-500">Send a message…</span>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-white">
              <ArrowRight size={14} aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
