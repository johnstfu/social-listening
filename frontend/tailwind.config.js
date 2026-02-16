/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coral: {
          50: '#FFF5F3',
          100: '#FFE8E3',
          200: '#FFD4CC',
          300: '#FFB5A6',
          400: '#FF8B75',
          500: '#FF6B4A',
          600: '#E54D2E',
          700: '#C03A1E',
          800: '#9A311A',
          900: '#7D2D1B',
        },
        navy: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#627D98',
          600: '#486581',
          700: '#334E68',
          800: '#243B53',
          900: '#0f172a',
        }
      }
    },
  },
  plugins: [],
}
