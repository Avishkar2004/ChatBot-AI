/** @type {import('tailwindcss').Config} */

/**
 * Design tokens.
 *
 * One accent (brand indigo). Semantic colours are reserved for state —
 * emerald = success, amber = warning, rose = danger — and are never used
 * decoratively. Depth comes from the surface ramp plus hairline borders,
 * not from glow.
 */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'Apple Color Emoji',
          'Segoe UI Emoji',
        ],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },

      /**
       * Display sizes carry their own tracking + leading so headings stay
       * optically tight at every breakpoint. Body text uses the stock ramp.
       */
      fontSize: {
        'display-xl': ['3.5rem', { lineHeight: '1.04', letterSpacing: '-0.035em' }],
        'display-lg': ['2.75rem', { lineHeight: '1.08', letterSpacing: '-0.032em' }],
        display: ['2.25rem', { lineHeight: '1.12', letterSpacing: '-0.028em' }],
        'display-sm': ['1.75rem', { lineHeight: '1.18', letterSpacing: '-0.024em' }],
        title: ['1.25rem', { lineHeight: '1.35', letterSpacing: '-0.016em' }],
        'title-sm': ['1.0625rem', { lineHeight: '1.4', letterSpacing: '-0.012em' }],
      },

      colors: {
        // Primary accent — the only decorative colour in the system.
        brand: {
          DEFAULT: '#6366f1',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Secondary hues — reserved for the logo gradient and rare accents.
        violet: { DEFAULT: '#8b5cf6', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed' },
        electric: { DEFAULT: '#3b82f6', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb' },

        // Surface ramp — every elevation step is a real token, never an opacity guess.
        surface: {
          DEFAULT: '#0a0b0f',
          base: '#0a0b0f',
          sunken: '#070809',
          raised: '#101218',
          elevated: '#161922',
          floating: '#1c2029',
          muted: '#22262f',
        },

        // Hairlines. `strong` is for hover/active borders only.
        line: {
          DEFAULT: 'rgba(255,255,255,0.08)',
          subtle: 'rgba(255,255,255,0.05)',
          strong: 'rgba(255,255,255,0.14)',
        },
      },

      // Controls: lg. Cards: xl. Overlays: 2xl. Nothing rounder.
      borderRadius: {
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },

      boxShadow: {
        subtle: '0 1px 2px rgba(0,0,0,0.4), 0 1px 1px rgba(0,0,0,0.24)',
        raised: '0 2px 4px rgba(0,0,0,0.4), 0 8px 24px -8px rgba(0,0,0,0.5)',
        floating: '0 8px 16px -4px rgba(0,0,0,0.5), 0 24px 48px -12px rgba(0,0,0,0.6)',
        overlay: '0 16px 32px -8px rgba(0,0,0,0.6), 0 40px 80px -16px rgba(0,0,0,0.7)',
        'inner-top': 'inset 0 1px 0 0 rgba(255,255,255,0.06)',
        // The only coloured shadow in the system — focus/selection affordance.
        'ring-brand': '0 0 0 1px rgba(99,102,241,0.4)',
      },

      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
      },

      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        spin: { to: { transform: 'rotate(360deg)' } },
        // Status-only pulse — signals liveness, never decoration.
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.82)' },
        },
        caret: { '0%, 45%': { opacity: '1' }, '55%, 100%': { opacity: '0' } },
      },

      animation: {
        shimmer: 'shimmer 1.6s infinite',
        'fade-up': 'fade-up 0.32s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.24s ease-out both',
        'scale-in': 'scale-in 0.18s cubic-bezier(0.22,1,0.36,1) both',
        'spin-slow': 'spin 0.7s linear infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        caret: 'caret 1.05s step-end infinite',
      },

      transitionTimingFunction: {
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
        snap: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
