/** Colors are CSS variables so light/dark themes swap in one place (src/index.css). */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: v('paper'),
        card: v('card'),
        sand: v('sand'),
        ink: v('ink'),
        soft: v('soft'),
        moss: v('moss'),
        'moss-ink': v('moss-ink'),
        sage: v('sage'),
        clay: v('clay'),
        sky: v('sky'),
        line: v('line'),
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
      },
      maxWidth: { frame: '34rem' },
    },
  },
  plugins: [],
};
