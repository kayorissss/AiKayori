/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        kayori: {
          black: '#080808',
          dark: '#0A0A0A',
          card: 'rgba(20,20,20,0.7)',
          gray: 'rgba(255,255,255,0.06)',
          lightgray: 'rgba(255,255,255,0.08)',
          border: 'rgba(255,255,255,0.06)',
          borderLight: 'rgba(255,255,255,0.08)',
          white: '#FFFFFF',
          muted: '#777777',
          mutedLight: '#999999',
        }
      },
      fontFamily: {
        sans: ['Gotham', 'Manrope', 'system-ui', 'sans-serif'],
        display: ['Gotham', 'Unbounded', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      borderRadius: { 'kayori': '20px', 'kayori-lg': '24px', 'kayori-xl': '28px' },
      backdropBlur: { 'glass': '24px', 'glass-strong': '32px' },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16,1,0.3,1)',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.16,1,0.3,1)',
        'typing': 'typing 1.4s infinite',
        'glass-in': 'glassIn 0.5s cubic-bezier(0.16,1,0.3,1)',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        scaleIn: { '0%': { transform: 'scale(0.94)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        typing: { '0%,60%,100%': { opacity: '0.3', transform: 'translateY(0)' }, '30%': { opacity: '1', transform: 'translateY(-1px)' } },
        glassIn: { '0%': { opacity: '0', backdropFilter: 'blur(0px)' }, '100%': { opacity: '1', backdropFilter: 'blur(24px)' } },
      }
    },
  },
  plugins: [],
}
