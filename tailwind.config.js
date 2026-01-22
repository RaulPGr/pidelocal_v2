/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui'],
        heading: ['var(--font-headings)', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        brand: {
          ink: 'var(--brand-ink)',
          muted: 'var(--brand-muted)',
          accent: 'var(--brand-accent)',
          'accent-700': 'var(--brand-accent-700)',
        }
      }
    },
  },
  plugins: [],
}
