import React from 'react';
import {
  BarChart3,
  FolderKanban,
  MessagesSquare,
  ShieldCheck,
  SlidersHorizontal,
  Zap,
} from 'lucide-react';
import { Container } from './ui';

/**
 * Every card used to carry its own gradient — emerald, blue, purple, orange,
 * green, indigo — which made the grid read as six unrelated products. Icons
 * now share one accent, and hierarchy comes from the copy instead.
 */
const features = [
  {
    icon: MessagesSquare,
    title: 'Context-aware conversations',
    description:
      'Each project keeps its own history, so an agent picks up a thread with everything said before it still in scope.',
  },
  {
    icon: FolderKanban,
    title: 'Projects, not one big inbox',
    description:
      'Group agents by purpose. Prompts, settings, and transcripts stay scoped to the project that owns them.',
  },
  {
    icon: Zap,
    title: 'Streamed token by token',
    description:
      'Responses render as they generate rather than landing in one block, so long answers stay readable while they arrive.',
  },
  {
    icon: SlidersHorizontal,
    title: 'A reusable prompt library',
    description:
      'Write instructions once, refine them in place, and reuse them across every conversation in the project.',
  },
  {
    icon: ShieldCheck,
    title: 'Scoped to your account',
    description:
      'Projects, prompts, and history are bound to the authenticated user. Sessions are token-based and revocable.',
  },
  {
    icon: BarChart3,
    title: 'Visible state',
    description:
      'See project counts, the active model, and connection status at a glance instead of guessing what is running.',
  },
];

const Features = () => (
  <section id="features" className="scroll-mt-20 py-24">
    <Container>
      <div className="max-w-2xl">
        <h2 className="font-display text-display-sm font-bold text-white sm:text-display">
          Everything you need to run an agent
        </h2>
        <p className="mt-4 text-base leading-relaxed text-slate-400">
          The parts that matter for day-to-day work — organising agents, shaping their
          instructions, and watching what they actually say.
        </p>
      </div>

      {/* gap-px over a line-coloured grid renders exact hairline dividers, so
          the cells read as one unified surface rather than six loose cards. */}
      <div className="mt-12 overflow-hidden rounded-2xl border border-line bg-line">
        <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group bg-surface-raised p-7 transition-colors duration-200 hover:bg-surface-elevated"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-white/[0.03] text-brand-300 transition-colors duration-200 group-hover:border-brand-500/30 group-hover:bg-brand-500/10">
                <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-title-sm font-semibold text-white">{title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </Container>
  </section>
);

export default Features;
