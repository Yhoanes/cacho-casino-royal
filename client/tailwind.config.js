/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      colors: {
        casino: {
          felt: '#064e3b',
          'felt-light': '#0d654d',
          'felt-dark': '#022c22',
          'felt-deep': '#011a14',
          leather: '#451a03',
          'leather-light': '#5c2306',
          'leather-dark': '#270f00',
          gold: '#d4af37',
          'gold-light': '#fef08a',
          'gold-dark': '#b45309',
          wood: '#3b1c10',
          cup: '#54250c',
        },
      },
      boxShadow: {
        '2d-table': 'inset 0 0 100px rgba(0, 0, 0, 0.85), 0 30px 60px -15px rgba(0, 0, 0, 0.95)',
        '2d-cup': '0 20px 40px rgba(0, 0, 0, 0.75), inset 0 3px 6px rgba(255, 255, 255, 0.25)',
        '2d-die': '0 10px 20px rgba(0, 0, 0, 0.5), inset 0 3px 3px rgba(255, 255, 255, 0.9), inset 0 -4px 5px rgba(0, 0, 0, 0.35)',
        '2d-die-kept': '0 0 25px rgba(245, 158, 11, 0.8), 0 10px 20px rgba(0, 0, 0, 0.6), inset 0 3px 3px rgba(255, 255, 255, 0.95), inset 0 -4px 6px rgba(180, 83, 9, 0.5)',
        'michi-cell': 'inset 0 3px 6px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(255, 255, 255, 0.08)',
        'michi-cell-active': '0 0 20px rgba(245, 158, 11, 0.4), inset 0 2px 4px rgba(0, 0, 0, 0.4)',
        'gold-glow': '0 0 25px rgba(245, 158, 11, 0.6), 0 0 50px rgba(245, 158, 11, 0.25)',
        'emerald-glow': '0 0 25px rgba(16, 185, 129, 0.6), 0 0 50px rgba(16, 185, 129, 0.25)',
        'active-turn': '0 0 30px rgba(245, 158, 11, 0.7), 0 0 60px rgba(245, 158, 11, 0.3)',
      },
      animation: {
        'dice-roll': 'rollDice 0.6s ease-out forwards',
        'cup-shake': 'shakeCup 0.45s ease-in-out infinite',
        'bounce-short': 'bounceShort 0.4s ease-in-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'active-turn-pulse': 'activeTurnPulse 2s ease-in-out infinite',
        'metallic-shine': 'metallicShine 3s linear infinite',
      },
      keyframes: {
        rollDice: {
          '0%': { transform: 'rotate(0deg) scale(0.65) translateY(-40px)', opacity: '0.4' },
          '45%': { transform: 'rotate(380deg) scale(1.1) translateY(8px)' },
          '75%': { transform: 'rotate(680deg) scale(0.96) translateY(-3px)' },
          '100%': { transform: 'rotate(720deg) scale(1) translateY(0)', opacity: '1' },
        },
        shakeCup: {
          '0%, 100%': { transform: 'rotate(0deg) translateY(0)' },
          '25%': { transform: 'rotate(-12deg) translateY(-8px)' },
          '50%': { transform: 'rotate(12deg) translateY(4px)' },
          '75%': { transform: 'rotate(-8deg) translateY(-4px)' },
        },
        bounceShort: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(245, 158, 11, 0.95)' },
        },
        activeTurnPulse: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(245, 158, 11, 0.5), 0 0 30px rgba(245, 158, 11, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(245, 158, 11, 0.95), 0 0 60px rgba(245, 158, 11, 0.45)' },
        },
        metallicShine: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
