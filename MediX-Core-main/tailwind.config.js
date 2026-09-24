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
        // Identidad propia: verde-azulado clínico ("MediX teal") en vez del
        // sky-blue por defecto de cualquier plantilla de Tailwind.
        hospital: {
          50: '#eefbf7',
          100: '#d5f5ec',
          200: '#aeead9',
          300: '#78d8bf',
          400: '#42bea0',
          500: '#219e83',
          600: '#157e69',
          700: '#116556',
          800: '#0f5145',
          900: '#0d423a',
          950: '#052622',
        },
        ink: {
          50: '#f5f6f8',
          100: '#e8eaee',
          200: '#cdd2db',
          300: '#a3abbb',
          400: '#727e95',
          500: '#535f78',
          600: '#414b60',
          700: '#353d4e',
          800: '#252b38',
          900: '#181c25',
          950: '#0d0f14',
        },
        accent: {
          400: '#f5b942',
          500: '#e79f1e',
          600: '#c17f11',
        },
        triage: {
          red: '#e0374a',
          orange: '#e2782f',
          yellow: '#d1a520',
          green: '#219e83',
          blue: '#3a6fd8',
        }
      },
      fontFamily: {
        sans: ['Sora', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Space Grotesk"', 'Sora', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(13,15,20,0.06), 0 8px 24px -8px rgba(13,15,20,0.10)',
        'card-hover': '0 2px 4px rgba(13,15,20,0.08), 0 16px 32px -12px rgba(13,15,20,0.16)',
      },
      borderRadius: {
        xl2: '1.125rem',
      }
    },
  },
  plugins: [],
}
