import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        pink: "#FF2E93",
        yellow: "#FFD400",
        mint: "#2EE6A6",
        purple: "#7C3AED",
      },
      fontFamily: {
        display: ["'Baloo 2'", "'Baloo Bhaijaan 2'", "sans-serif"],
        body: ["'Tajawal'", "'Nunito'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
