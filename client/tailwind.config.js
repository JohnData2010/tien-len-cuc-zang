/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
          700: '#A16207',
        },
        casino: {
          green: '#064e3b',
          darkgreen: '#022c22',
          gold: '#d97706',
          felt: '#0f5132',
        }
      },
      keyframes: {
        cardLift: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(234, 179, 8, 0.6)' },
          '50%': { boxShadow: '0 0 25px rgba(234, 179, 8, 0.9)' },
        }
      },
      animation: {
        'card-lift': 'cardLift 0.15s ease-out forwards',
        'pulse-glow': 'pulseGlow 1.5s infinite',
      }
    },
  },
  plugins: [],
}
