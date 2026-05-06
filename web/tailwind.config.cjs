/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d2d8e0',
          300: '#aeb7c5',
          400: '#7e8a9c',
          500: '#586374',
          600: '#3f4858',
          700: '#2c3441',
          800: '#1c222b',
          900: '#0e1218',
        },
        accent: {
          50: '#eef4ff',
          100: '#dde9ff',
          200: '#bdd2ff',
          300: '#8eb3ff',
          400: '#5a8bff',
          500: '#3766f0',
          600: '#244fcb',
          700: '#1d3fa3',
          800: '#1b3781',
          900: '#1c3068',
        },
        moss: {
          400: '#36b37e',
          500: '#22a06a',
          600: '#168151',
        },
        amber: {
          400: '#f0a500',
          500: '#d18d00',
        },
        rose: {
          400: '#ef4d4d',
          500: '#d83a3a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 0 rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
};
