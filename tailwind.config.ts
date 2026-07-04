import type { Config } from "tailwindcss";

/**
 * Tailwind theme mirrors the Everest portal design tokens (see app/globals.css :root).
 * Utilities like text-fg1, bg-page, border-subtle, text-primary resolve to the CSS vars,
 * so components stay in sync with the token source of truth.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "var(--brand-50)",
          100: "var(--brand-100)",
          500: "var(--brand-500)",
          600: "var(--brand-600)",
          700: "var(--brand-700)",
        },
        navy: {
          500: "var(--navy-500)",
        },
        fg1: "var(--fg1)",
        fg2: "var(--fg2)",
        fg3: "var(--fg3)",
        fg4: "var(--fg4)",
        page: "var(--bg-page)",
        surface: "var(--bg-surface)",
        success: "var(--success-500)",
        warn: "var(--warn-500)",
        danger: "var(--danger-500)",
      },
      borderColor: {
        subtle: "var(--border-subtle)",
        default: "var(--border-default)",
      },
      fontFamily: {
        display: "var(--font-display)",
        body: "var(--font-body)",
      },
      borderRadius: {
        glass: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
