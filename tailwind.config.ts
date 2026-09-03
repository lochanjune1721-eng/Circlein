import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0A0A0B',
          raised: '#111113',
          card: '#151517',
          line: '#232329',
          soft: '#2E2E36',
        },
        bone: {
          DEFAULT: '#F2EEE6',
          dim: '#A29D94',
          faint: '#6E6A63',
        },
        gold: {
          DEFAULT: '#D8A657',
          bright: '#EDC078',
          deep: '#8A6A31',
        },
        verified: '#7FB069',
        flag: '#D98453',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        eyebrow: '0.18em',
      },
      maxWidth: {
        prose: '68ch',
      },
      animation: {
        'rise': 'rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade': 'fade 0.6s ease both',
        'sweep': 'sweep 2.4s ease-in-out infinite',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fade: { from: { opacity: '0' }, to: { opacity: '1' } },
        sweep: {
          '0%,100%': { opacity: '0.25' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
