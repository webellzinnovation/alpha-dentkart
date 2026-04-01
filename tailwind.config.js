/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#DD3B5F",
        secondary: "#1F2937",
        "background-light": "#F3F4F6",
        "background-dark": "#111827",
        "surface-light": "#FFFFFF",
        "surface-dark": "#1F2937",
        "text-light": "#374151",
        "text-dark": "#E5E7EB",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
      },
      animation: {
        'infinite-scroll': 'infinite-scroll 80s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        'infinite-scroll': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
