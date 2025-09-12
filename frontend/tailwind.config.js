/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'ride-in': {
          '0%': { transform: 'translateX(-200px) rotate(-10deg)', opacity: '0' },
          '60%': { transform: 'translateX(20px) rotate(5deg)', opacity: '1' },
          '100%': { transform: 'translateX(0) rotate(0)', opacity: '1' },
        },
        'floaty': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'card-pop': {
          '0%': { transform: 'translateY(12px) scale(.985)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        'trail': {
          '0%': { transform: 'translateX(-30px)', opacity: '0' },
          '50%': { opacity: '0.85' },
          '100%': { transform: 'translateX(30px)', opacity: '0' },
        },
        'wiggle': {
          '0%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
          '100%': { transform: 'rotate(-3deg)' },
        },
      },
      animation: {
        'ride-in': 'ride-in 900ms cubic-bezier(.22,.9,.3,1) forwards',
        'floaty': 'floaty 3.5s ease-in-out infinite',
        'card-pop': 'card-pop 650ms cubic-bezier(.22,.9,.3,1) both',
        'trail': 'trail 900ms ease-out both',
        'wiggle': 'wiggle 2.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
