/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        // Primary brand ramp — electric blue → indigo → violet.
        // Kept under the `brand` key so existing `brand-*` utilities keep working.
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
        // Violet — the warmer end of the primary spectrum, used for gradients/glows.
        violet: {
          DEFAULT: '#8b5cf6',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        // Electric blue — the cooler end, used for highlights and links.
        electric: {
          DEFAULT: '#3b82f6',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
        },
        // Accent — cyan + emerald for success / secondary highlights.
        cyan: {
          DEFAULT: '#22d3ee',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        // Graphite surface system — layered depth from base → elevated → floating.
        surface: {
          DEFAULT: '#0a0b0f',   // app background (deep graphite)
          base: '#0a0b0f',
          sunken: '#070809',    // recessed wells
          raised: '#101218',    // cards
          elevated: '#161922',  // popovers / elevated cards
          floating: '#1c2029',  // menus / modals
          muted: '#22262f',     // hover fills, inputs
        },
        // Hairline borders tuned for graphite surfaces.
        line: {
          DEFAULT: 'rgba(255,255,255,0.08)',
          subtle: 'rgba(255,255,255,0.06)',
          strong: 'rgba(255,255,255,0.14)',
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        // Premium layered depth — softer, more diffuse than default Tailwind.
        'subtle': '0 1px 2px rgba(0,0,0,0.4), 0 1px 1px rgba(0,0,0,0.25)',
        'raised': '0 2px 4px rgba(0,0,0,0.4), 0 8px 24px -8px rgba(0,0,0,0.5)',
        'floating': '0 8px 16px -4px rgba(0,0,0,0.5), 0 24px 48px -12px rgba(0,0,0,0.6)',
        'overlay': '0 16px 32px -8px rgba(0,0,0,0.6), 0 40px 80px -16px rgba(0,0,0,0.7)',
        // Colored glows for primary / accent emphasis.
        'glow-brand': '0 0 0 1px rgba(99,102,241,0.35), 0 8px 32px -8px rgba(99,102,241,0.5)',
        'glow-violet': '0 0 40px -8px rgba(139,92,246,0.55)',
        'glow-cyan': '0 0 40px -8px rgba(34,211,238,0.5)',
        'inner-top': 'inset 0 1px 0 0 rgba(255,255,255,0.06)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #3b82f6 0%, #6366f1 45%, #8b5cf6 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, rgba(59,130,246,0.16) 0%, rgba(99,102,241,0.16) 50%, rgba(139,92,246,0.16) 100%)',
        'aurora': 'radial-gradient(60% 60% at 20% 20%, rgba(99,102,241,0.30) 0%, transparent 60%), radial-gradient(50% 50% at 80% 25%, rgba(34,211,238,0.22) 0%, transparent 55%), radial-gradient(60% 60% at 60% 90%, rgba(139,92,246,0.28) 0%, transparent 60%)',
        'mesh': 'radial-gradient(at 27% 37%, rgba(59,130,246,0.18) 0, transparent 45%), radial-gradient(at 79% 33%, rgba(139,92,246,0.16) 0, transparent 45%), radial-gradient(at 48% 82%, rgba(34,211,238,0.12) 0, transparent 45%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'aurora-drift': {
          '0%': { transform: 'translate3d(0,0,0) rotate(0deg) scale(1)' },
          '33%': { transform: 'translate3d(2%, -3%, 0) rotate(2deg) scale(1.05)' },
          '66%': { transform: 'translate3d(-2%, 2%, 0) rotate(-2deg) scale(0.98)' },
          '100%': { transform: 'translate3d(0,0,0) rotate(0deg) scale(1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 24px -6px rgba(99,102,241,0.45)' },
          '50%': { boxShadow: '0 0 48px -4px rgba(139,92,246,0.7)' },
        },
        'shimmer': {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'thinking-pulse': {
          '0%, 100%': { opacity: '0.35', transform: 'scale(0.85)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
        'spin-slow': {
          'to': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'gradient': 'gradient-pan 6s ease infinite',
        'aurora': 'aurora-drift 24s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.8s infinite',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.22,1,0.36,1) both',
        'thinking': 'thinking-pulse 1.2s ease-in-out infinite',
        'spin-slow': 'spin-slow 1s linear infinite',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'snap': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
