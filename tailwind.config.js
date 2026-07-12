/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Deep space navy — main theme palette (used throughout existing components)
        navy: {
          900: '#060b18',  // deepest background
          800: '#0b1425',  // card backgrounds
          700: '#101d35',  // elevated cards
          600: '#1a2d4a',  // borders
          500: '#25405e',  // muted borders
          400: '#4a6480',  // muted text
        },
        // Status / CTA accents — keep existing keys so all components work
        accent: {
          orange: '#f59e0b',   // primary CTA buttons
          gold:   '#fbbf24',   // CTA hover
          green:  '#10b981',   // success / pass
          red:    '#f43f5e',   // error / fail
          yellow: '#eab308',   // warning
        },
        // NexuCV brand colors — indigo/violet gradient identity
        brand: {
          indigo: '#6366f1',
          violet: '#8b5cf6',
          purple: '#a855f7',
          glow:   'rgba(99,102,241,0.15)',
        },
      },
      backgroundImage: {
        'brand-gradient':  'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #a855f7 100%)',
        'hero-radial':     'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 70%)',
        'card-shimmer':    'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(139,92,246,0.03) 100%)',
        'amber-gradient':  'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'brand':     '0 0 40px rgba(99,102,241,0.15)',
        'brand-lg':  '0 0 80px rgba(99,102,241,0.25)',
        'amber':     '0 4px 24px rgba(245,158,11,0.30)',
        'card':      '0 4px 32px rgba(0,0,0,0.40)',
        'card-hover':'0 8px 48px rgba(99,102,241,0.12)',
        'glass':     '0 1px 0 rgba(255,255,255,0.06) inset',
      },
      animation: {
        'fade-in':      'fadeIn 0.4s ease-out',
        'slide-up':     'slideUp 0.5s ease-out',
        'slide-down':   'slideDown 0.3s ease-out',
        'pulse-slow':   'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float':        'float 6s ease-in-out infinite',
        'glow-pulse':   'glowPulse 3s ease-in-out infinite alternate',
        'gradient':     'gradientShift 8s ease infinite',
        'spin-slow':    'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%':   { boxShadow: '0 0 20px rgba(99,102,241,0.20)' },
          '100%': { boxShadow: '0 0 50px rgba(139,92,246,0.40)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
};
