/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        office: '#2563eb',
        private: '#22c55e',
        suboffice: '#f97316'
      }
    }
  },
  plugins: []
};
