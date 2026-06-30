import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#eef3f2",
          100: "#d4e3e0",
          200: "#a9c7c1",
          300: "#7eaba2",
          400: "#4f8a7e",
          500: "#2f6b5f",
          600: "#1f5247",
          700: "#163e36",
          800: "#102e28",
          900: "#0b2e2a",
          950: "#071f1c",
        },
        amber: {
          50: "#fdf3e9",
          100: "#fae2c4",
          200: "#f4c992",
          300: "#edab5d",
          400: "#e8924a",
          500: "#dd7a2e",
          600: "#c2611f",
          700: "#9c4a18",
          800: "#7a3a17",
          900: "#612f15",
        },
        paper: {
          DEFAULT: "#f7f5f0",
          dim: "#efece3",
          line: "#e3ded2",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgba(11,46,42,0.04), 0 1px 6px -1px rgba(11,46,42,0.06)",
        card: "0 2px 8px -2px rgba(11,46,42,0.10), 0 1px 2px rgba(11,46,42,0.04)",
        pop: "0 12px 32px -8px rgba(11,46,42,0.22)",
      },
      borderRadius: {
        xl2: "1.1rem",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        shimmer: { "0%": { backgroundPosition: "-468px 0" }, "100%": { backgroundPosition: "468px 0" } },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
