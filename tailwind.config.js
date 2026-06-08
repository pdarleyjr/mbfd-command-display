/** @type {import('tailwindcss').Config} */
// MBFD Command Glass — dark smart-city / restrained-JARVIS design system.
// Color values mirror src/styles/tokens.css (CSS custom properties are the source of
// truth at runtime; these literals let Tailwind utilities resolve at build time).
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Foundation — deep navy / graphite
        abyss: '#070C16', // deepest backdrop
        navy: {
          DEFAULT: '#0B1220',
          900: '#0B1220',
          800: '#0F1A2E',
          700: '#13243E',
        },
        graphite: {
          DEFAULT: '#16202F',
          700: '#1B2839',
          600: '#243349',
        },
        ink: '#E6EDF7', // primary text
        mute: '#93A4BE', // secondary text
        faint: '#5C6E89', // tertiary / labels
        // Status semantics (never color-alone — always paired with icon/label)
        ready: '#21D07A', // green — in service / compliant
        attention: '#FFC53D', // amber — warning / pending
        critical: '#FF5C6C', // red — out of service / critical / missing
        info: '#4DA3FF', // blue — info / AI
        // Restrained fire accent for critical/live emphasis
        ember: '#FF6A3D',
        // Interactive cyan stroke (drill-down outline only)
        cyan: {
          DEFAULT: '#37E6E0',
          dim: '#1E8F8B',
        },
        // Marine accent for Station 6
        marine: '#2FB6C9',
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Distance-readable scale; tabular numerics applied via .tnum utility
        metric: ['clamp(2rem, 3.2vw, 4rem)', { lineHeight: '1', fontWeight: '700' }],
        'metric-sm': ['clamp(1.4rem, 2vw, 2.2rem)', { lineHeight: '1.05', fontWeight: '700' }],
      },
      borderRadius: {
        glass: '16px',
        'glass-lg': '22px',
      },
      boxShadow: {
        glass: '0 10px 40px -12px rgba(0, 0, 0, 0.65), inset 0 1px 0 0 rgba(255,255,255,0.04)',
        'glass-lg': '0 24px 70px -18px rgba(0, 0, 0, 0.75), inset 0 1px 0 0 rgba(255,255,255,0.05)',
        glow: '0 0 0 1px rgba(55,230,224,0.18), 0 0 24px -6px rgba(55,230,224,0.35)',
      },
      backdropBlur: {
        glass: '18px',
      },
      keyframes: {
        'fresh-pulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(55,230,224,0.45)' },
          '70%': { boxShadow: '0 0 0 10px rgba(55,230,224,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(55,230,224,0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'live-blink': {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        sheen: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(120%)' },
        },
      },
      animation: {
        'fresh-pulse': 'fresh-pulse 2.2s ease-out',
        'slide-in': 'slide-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        'live-blink': 'live-blink 1.6s ease-in-out infinite',
        sheen: 'sheen 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
