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
        aura: {
          950: '#090a0f', // deep obsidian background
          900: '#10131d', // card background
          850: '#161a29', // elevated card/hover
          800: '#1e2438', // borders & dividers
          700: '#2d3652',
          600: '#435178',
          accent: '#f59e0b', // warm bookish amber
          'accent-hover': '#d97706',
          'accent-light': '#fef3c7',
          glow: '#ffb703',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
      },
      boxShadow: {
        'book': '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
        'book-hover': '0 20px 35px -5px rgba(245, 158, 11, 0.25), 0 10px 15px -5px rgba(0, 0, 0, 0.5)',
        'player': '0 -10px 30px rgba(0, 0, 0, 0.7)',
        'amber-glow': '0 0 20px rgba(245, 158, 11, 0.35)',
      }
    },
  },
  plugins: [],
}
