import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#fdf6ec',
        warm: '#f5e6cc',
        brown: '#3d1f0a',
        caramel: '#c8773a',
        gold: '#e8a44a',
        soft: '#8b5e3c',
        card: '#fffaf4',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        toastIn: {
          from: { transform: 'translateX(110%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        spinCustom: {
          to: { transform: 'rotate(360deg)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        toastIn: 'toastIn 0.3s ease forwards',
        spinCustom: 'spinCustom 0.8s linear infinite',
        fadeIn: 'fadeIn 0.4s ease',
      },
    },
  },
  plugins: [],
}
export default config
