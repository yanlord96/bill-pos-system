/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#EEF1FE',
          100: '#D9DFFE',
          200: '#B3BFFD',
          300: '#8D9FFC',
          400: '#6E84F9',
          500: '#4F6EF7',
          600: '#3B5AE6',
          700: '#2D47C4',
          800: '#2239A0',
          900: '#1A2D7D',
        },
        surface: '#F7F8FC',
        'surface-dark': '#0f1117',
      },
    },
  },
  plugins: [],
};
