/** @type {import('tailwindcss').Config} */
// MBFD "Watch Desk" — flat instrument-grade command console.
// Color values mirror src/styles/tokens.css (the CSS custom properties are the runtime
// source of truth; these literals let Tailwind utilities resolve at build time).
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Foundation — flat graphite
        abyss: '#090D14',
        navy: {
          DEFAULT: '#0E1219',
          900: '#0E1219',
          800: '#121826',
          700: '#16203A',
        },
        graphite: {
          DEFAULT: '#171D28',
          700: '#1C2330',
          600: '#1F2735',
        },
        ink: '#E9EDF4',
        mute: '#A4AFC1',
        faint: '#74809A',
        // Status semantics (icon/label always paired — never color-alone)
        ready: '#34C98A',
        attention: '#E8B13A',
        critical: '#E2503F',
        info: '#4F8BD6',
        // Ember — LIVE indicator + critical-action emphasis only
        ember: '#EF6A32',
        // Interactive navy (drill-down / focus). 'cyan' kept as an alias → navy so any
        // stray reference degrades to the brand accent, never neon.
        interactive: '#4F8BD6',
        cyan: {
          DEFAULT: '#4F8BD6',
          dim: '#2A4E86',
        },
        marine: '#2FB6C9',
      },
      fontFamily: {
        display: ['Saira', 'system-ui', 'Segoe UI', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        metric: ['clamp(1.7rem, 1.3rem + 1.4vw, 2.7rem)', { lineHeight: '1', fontWeight: '700' }],
        'metric-sm': ['clamp(1.35rem, 1.1rem + 0.9vw, 2rem)', { lineHeight: '1.05', fontWeight: '700' }],
      },
      borderRadius: {
        glass: '14px',
        'glass-lg': '16px',
      },
      boxShadow: {
        glass: '0 1px 0 0 rgba(255,255,255,0.03)',
        'glass-lg': '0 14px 36px -20px rgba(0,0,0,0.8), inset 0 1px 0 0 rgba(255,255,255,0.04)',
        glow: '0 0 0 1px rgba(79,139,214,0.35)',
      },
      keyframes: {
        'fresh-pulse': {
          '0%': { borderColor: 'rgba(79,139,214,0.8)' },
          '100%': { borderColor: 'rgba(150,165,190,0.16)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'live-blink': {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
      },
      animation: {
        'fresh-pulse': 'fresh-pulse 1.6s ease-out',
        'slide-in': 'slide-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        'live-blink': 'live-blink 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
