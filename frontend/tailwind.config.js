/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#0F2D5C',
          green: '#1F7A4D',
          greenDark: '#165a38',
          greenLight: '#2ea46a',
          cream: '#F8F7F3',
          sage: '#EAF4EE',
          border: '#D8E6DD',
          gold: '#C59B27',
        },
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        hazard: {
          red: '#ef4444',
          amber: '#f59e0b',
          blue: '#3b82f6',
          green: '#10b981'
        }
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
