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
        bg: '#070B14',
        card: '#101726',
        accent: '#35E0A1',
        soft: '#1A2438',
      },
      boxShadow: {
        glow: '0 0 40px rgba(53, 224, 161, 0.15)',
      },
    },
  },
  plugins: [],
};
