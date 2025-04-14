// tailwind.config.js
module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
        },
        keyframes: {
          'fade-in-out': {
            '0%': { opacity: '0' },
            '10%': { opacity: '1' },
            '90%': { opacity: '1' },
            '100%': { opacity: '0' },
          },
        },
        animation: {
          'fade-in-out': 'fade-in-out 4s ease-in-out forwards',
        },
      },
    },
    plugins: [],
  }