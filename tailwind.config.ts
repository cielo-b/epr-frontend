import type { Config } from "tailwindcss";

// EPR Brand Colors - Presbyterian Green
const eprGreen = {
  50: "#e6f3ec",
  100: "#cce7d9",
  200: "#99cfb3",
  300: "#66b78e",
  400: "#339f68",
  500: "#1f7a59",
  600: "#0f5132", // Primary EPR Brand Color
  700: "#0c4027",
  800: "#0a321f",
  900: "#072418",
};

// EPR Accent Gold - Spiritual Richness
const eprGold = {
  50: "#fefbf3",
  100: "#fdf6e3",
  200: "#faedc7",
  300: "#f7e3a7",
  400: "#f0d470",
  500: "#D4AF37", // Primary Gold
  600: "#b8941f",
  700: "#947616",
  800: "#6b5410",
  900: "#4a380b",
};

// Status Colors
const statusRed = {
  50: "#fdf3f3",
  100: "#fbe6e6",
  200: "#f5c8c8",
  300: "#eea3a3",
  400: "#e26f6f",
  500: "#c24141",
  600: "#9f1f1f",
  700: "#7f1d1d",
  800: "#651111",
  900: "#4b0c0c",
};

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: eprGreen,
        "epr-green": eprGreen,
        "epr-gold": eprGold,
        "status-red": statusRed,
        "brand-black": "#0b0c0c",
      },
    },
  },
  plugins: [],
};
export default config;
