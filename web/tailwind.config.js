/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6C3BFF',
          dark: '#582BE8',
          light: '#8558FF',
        },
        secondaryLight: '#F3EFFF',
        background: '#F8F9FD',
        card: '#FFFFFF',
        cardBorder: '#EAEAEE',
        textMain: '#111114',
        textSecondary: '#6E6E77',
        textMuted: '#9E9EA7',
        accentGold: '#FFB800',
        success: '#10B981',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
