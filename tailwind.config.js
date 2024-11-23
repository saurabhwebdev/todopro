/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'surface': {
          DEFAULT: '#ffffff',
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          focus: '#f8fafc',
          active: '#f1f5f9',
          hover: '#f8fafc',
        },
        'accent': {
          primary: '#6366f1',    // Indigo
          secondary: '#ec4899',  // Pink
          tertiary: '#10b981',   // Emerald
          quaternary: '#f59e0b', // Amber
        },
        'cognitive': {
          primary: '#1e293b',   // Primary text - high cognitive load items
          secondary: '#475569', // Secondary text - medium cognitive load
          tertiary: '#94a3b8',  // Tertiary text - low cognitive load
          ghost: '#cbd5e1',     // Ghost elements - minimal cognitive load
        },
      },
      backgroundImage: {
        'gradient-natural': 'linear-gradient(to right, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1))',
        'glass-gradient': 'linear-gradient(rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9))',
        'glass-gradient-hover': 'linear-gradient(rgba(255, 255, 255, 0.97), rgba(255, 255, 255, 0.92))',
      },
      boxShadow: {
        'natural': '0 4px 20px -1px rgba(0, 0, 0, 0.05)',
        'natural-sm': '0 2px 10px -1px rgba(0, 0, 0, 0.03)',
        'natural-lg': '0 8px 30px -1px rgba(0, 0, 0, 0.08)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        glow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        pulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.5s linear infinite',
        slideIn: 'slideIn 0.2s ease-out',
        fadeIn: 'fadeIn 0.3s ease-out',
        glow: 'glow 2s ease-in-out infinite',
        pulse: 'pulse 2s ease-in-out infinite',
      },
      spacing: {
        'cognitive-1': '0.25rem',  // Minimal spacing
        'cognitive-2': '0.5rem',   // Related items spacing
        'cognitive-3': '1rem',     // Group spacing
        'cognitive-4': '1.5rem',   // Section spacing
        'cognitive-5': '2rem',     // Major section spacing
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

