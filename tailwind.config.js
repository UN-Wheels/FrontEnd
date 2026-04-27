/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#6366F1',
          light:   '#818CF8',
          dark:    '#4F46E5',
          50:      '#EEF2FF',
          100:     '#E0E7FF',
        },
        secondary: {
          DEFAULT: '#1E1B4B',
          light:   '#312E81',
          medium:  '#2D2B6B',
          dark:    '#161430',
        },
        accent: {
          DEFAULT: '#10B981',
          dark:    '#059669',
          light:   '#34D399',
        },
      },
      boxShadow: {
        soft:  '0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04)',
        card:  '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        glow:  '0 0 24px rgba(99,102,241,0.22)',
        panel: '0 8px 32px -4px rgba(30,27,75,0.18), 0 2px 8px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
