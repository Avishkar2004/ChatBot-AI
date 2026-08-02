import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Logo } from './ui';

/**
 * Only routes that exist are links. Placeholder anchors to `#pricing` and
 * `#docs` were dead ends — they now read as plain text until those pages ship,
 * which is more honest than a link that goes nowhere.
 */
const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', to: '/features' },
      { label: 'Projects', to: '/projects' },
      { label: 'Dashboard', to: '/dashboard' },
    ],
  },
  {
    title: 'Resources',
    items: ['Documentation', 'API reference', 'Changelog'],
  },
  {
    title: 'Legal',
    items: ['Privacy', 'Terms', 'Security'],
  },
];

const Footer = () => (
  <footer className="mt-24 border-t border-line bg-surface-sunken/40">
    <Container className="py-12">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo size="sm" />
          <p className="mt-3.5 text-[13px] leading-relaxed text-slate-500">
            Build, configure, and ship AI chat agents with reusable prompts and streaming responses.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-500">
              {column.title}
            </h2>
            <ul className="mt-3.5 space-y-2.5">
              {column.links?.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="focus-ring rounded text-[13px] text-slate-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {column.items?.map((item) => (
                <li key={item} className="text-[13px] text-slate-600">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-slate-500">
          © {new Date().getFullYear()} Chatbot AI. All rights reserved.
        </p>
        <p className="inline-flex items-center gap-2 text-[13px] text-slate-500">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400" />
          All systems operational
        </p>
      </div>
    </Container>
  </footer>
);

export default Footer;
