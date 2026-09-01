import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'Geist', 'system-ui', 'sans-serif'],
        heading: ['var(--font-serif)', 'Instrument Serif', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'Geist Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        /**
         * Ink on warm paper, with a single accent.
         *
         * The old palette pivoted on #7C3AED and shipped purple-tinted shadows
         * and a purple→pink gradient — the exact signature of a generated SaaS
         * template. Here the primary action colour is near-black: the accent is
         * spent on one thing at a time, never on a whole hero.
         *
         * Neutrals are warm rather than blue-grey, so paper reads as paper.
         */
        ink: {
          DEFAULT: '#141311',
          50: '#F7F5F0',
          100: '#EDEAE3',
          200: '#DCD8CF',
          300: '#BEB8AC',
          400: '#8C877C',
          500: '#6B665D',
          600: '#4A4640',
          700: '#33302B',
          800: '#22201C',
          900: '#141311',
          950: '#0B0A09',
        },
        paper: {
          DEFAULT: '#F7F5F0',
          raised: '#FFFFFF',
          sunken: '#EDEAE3',
        },
        accent: {
          DEFAULT: '#AE3B22',
          soft: '#C9583C',
          muted: '#F2E3DD',
          contrast: '#8A2D19',
        },
        // Kept because `primary-*` classes are still scattered across the app;
        // remapped off purple so nothing has to be rewritten to stop being
        // violet. New work should use `ink` and `accent`.
        primary: {
          50: '#F7F5F0',
          100: '#EDEAE3',
          200: '#DCD8CF',
          300: '#BEB8AC',
          400: '#8C877C',
          500: '#4A4640',
          600: '#33302B',
          700: '#141311',
          800: '#0B0A09',
          900: '#000000',
        },
      },
      boxShadow: {
        // Neutral and shallow. The old ones cast purple, which tinted every
        // white card on the page.
        premium: '0 1px 2px rgba(20,19,17,0.05), 0 8px 24px -12px rgba(20,19,17,0.14)',
        'premium-lg': '0 24px 60px -28px rgba(20,19,17,0.28)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float-slow": "float-slow 7s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config