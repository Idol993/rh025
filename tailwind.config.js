/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1890ff',
        success: '#52c41a',
        warning: '#faad14',
        danger: '#f5222d',
        dark: '#0a1628',
        darker: '#060d1a',
        'panel-bg': 'rgba(10, 22, 40, 0.8)',
        'border-glow': 'rgba(24, 144, 255, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(24, 144, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(24, 144, 255, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}
