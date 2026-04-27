import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "fire-orange": "#ff4500",
        "fire-amber": "#ff8c00",
        "risk-low": "#14b8a6",
        "risk-medium": "#f59e0b",
        "risk-high": "#ef4444",
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      boxShadow: {
        premium: "var(--card-shadow)",
      },
    },
  },
  plugins: [],
};
export default config;
