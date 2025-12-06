/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0A2463', // Deep Blue
        secondary: '#3E92CC', // Bright Blue (can be used for CTAs like search/apply)
        accent: '#FFD700', // Gold / Yellow (for highlights, premium features)
        neutral: {
          light: '#F8F9FA', // Very Light Gray (page backgrounds)
          DEFAULT: '#E9ECEF', // Light Gray (borders, dividers, disabled states)
          dark: '#6C757D', // Gray (text, icons)
          darker: '#343A40', // Darker gray for text or footers
        },
        white: '#FFFFFF',
        black: '#000000',
        danger: '#DC3545', // Red for errors/deletions
        success: '#198754', // Green for success
        warning: '#FFC107', // Yellow for warnings
        info: '#0DCAF0' // Light blue for info
      },
      animation: {
        fadeInRight: 'fadeInRight 0.3s ease-out forwards',
        fadeInDown: 'fadeInDown 0.5s ease-out forwards',
        fadeInUp: 'fadeInUp 0.5s ease-out 0.2s forwards',
        fadeIn: 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        fadeInRight: {
          from: { opacity: '0', transform: 'translateX(100%)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        fadeInDown: { 
          '0%': { opacity:'0', transform: 'translateY(-20px)' }, 
          '100%': { opacity:'1', transform: 'translateY(0)' } 
        },
        fadeInUp: { 
          '0%': { opacity:'0', transform: 'translateY(20px)' }, 
          '100%': { opacity:'1', transform: 'translateY(0)' } 
        },
        fadeIn: { 
          '0%': { opacity:'0' }, 
          '100%': { opacity:'1' } 
        },
      }
    },
  },
  plugins: [],
}

