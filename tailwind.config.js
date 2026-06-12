/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#050d1a',
        foreground: '#e2e8f0',
        card: { DEFAULT: '#091524', foreground: '#e2e8f0' },
        primary: { DEFAULT: '#6366f1', foreground: '#ffffff' },
        secondary: { DEFAULT: '#1a2e4a', foreground: '#94a3b8' },
        muted: { DEFAULT: '#0f1e32', foreground: '#64748b' },
        accent: { DEFAULT: '#6366f1', foreground: '#ffffff' },
        destructive: { DEFAULT: '#ef4444', foreground: '#ffffff' },
        border: '#1a2e4a',
        input: '#0f1e32',
        ring: '#6366f1',
      },
      borderRadius: { lg: '0.75rem', md: '0.625rem', sm: '0.5rem' },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.6s ease-out',
        'float': 'float 4s ease-in-out infinite',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up': { '0%': { opacity: '0', transform: 'translateY(24px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'float': { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
