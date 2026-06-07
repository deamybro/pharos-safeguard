import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"]
      },
      colors: {
        base: "#0A0A0F",
        surface: "#12121A",
        elevated: "#1A1A26",
        border: "#2A2A3A",
        muted: "#8888AA",
        accent: "#6366F1",
        pharos: "#3B82F6"
      }
    }
  },
  plugins: []
};

export default config;
