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
        black: "#000000",
        "pale-gray": "#f5f5f7",
        "near-black": "#1d1d1f",
        "apple-blue": "#0071e3",
        "link-blue": "#0066cc",
        "highlight-blue": "#2997ff",
        white: "#ffffff",
        "graphite-a": "#272729",
        "graphite-b": "#262629",
        "graphite-c": "#28282b",
        "graphite-d": "#2a2a2c",
        "neutral-gray": "#6e6e73",
        "soft-border": "#d2d2d7",
        "mid-border": "#86868b",
        "dark-gray": "#424245",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-geist-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      letterSpacing: {
        tight: "0",
        tighter: "0",
      },
      borderRadius: {
        sm: "5px",
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
        xl: "18px",
        "2xl": "24px",
        "3xl": "28px",
        "4xl": "36px",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
export default config;
