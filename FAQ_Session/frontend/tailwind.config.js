/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          cream: '#FFFFFF',
          yellow: '#EFF6FF', // mapped to very soft blue for background consistency
          green: '#ECFDF5',  // soft green tint
          blue: '#EFF6FF',   // soft blue tint
          pink: '#FDF2F8',   // soft pink tint
          purple: '#F5F3FF', // soft purple tint
          orange: '#FFF7ED', // soft orange tint
        }
      },
      boxShadow: {
        'neo-sm': '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        'neo-md': '0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
        'neo-lg': '0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -4px rgba(15, 23, 42, 0.05)',
      },
      fontFamily: {
        comic: ['"Inter"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
