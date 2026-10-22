/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          base: '#07090e',
          surface: '#0d1117',
          card: '#121721',
          border: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.14)',
        },
        cyber: {
          emerald: '#10b981',
          blue: '#3b82f6',
          amber: '#f59e0b',
          rose: '#f43f5e',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': "radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
