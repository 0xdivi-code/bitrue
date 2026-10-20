/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // dark surfaces (trading terminal)
        night: {
          900: '#0b0e11',
          800: '#12161c',
          700: '#161b22',
          600: '#1c222b',
          500: '#232833',
        },
        bd: {
          dark: '#232a35',
          light: '#e6e8eb',
        },
        txt: {
          primary: '#eaecef',
          secondary: '#848e9c',
          muted: '#5e6673',
          dark: '#1e2329',
          darksec: '#707a8a',
        },
        accent: {
          DEFAULT: '#f0b90b',
          soft: '#ffcc33',
          hover: '#ffd24d',
          deep: '#c99b06',
        },
        up: '#0ecb81',
        down: '#f6465d',
        purple: '#9244ff',
      },
      fontFamily: {
        sans: [
          'HarmonyOS Sans',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.1)',
        pop: '0 12px 32px rgba(0,0,0,.18)',
      },
      maxWidth: {
        shell: '1240px',
      },
    },
  },
  plugins: [],
};
