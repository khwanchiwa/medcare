import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 900: "#17324D", 800: "#155F8F" },
        blue: { 600: "#155F8F", 500: "#2088C7", 100: "#EDF8FF" },
        sky: { 50: "#F4FBFF" },
        success: { 600: "#24966B", 100: "#DFF8EF" },
        amber: { 600: "#A76500", 100: "#FFF3D9" },
        slate: { 800: "#17324D", 600: "#667B8F", 400: "#8AA6B8" },
        border: "#D9E9F3",
        white: "#FFFFFF",
      },
      borderRadius: { card: "8px", section: "8px" },
      boxShadow: { soft: "0 18px 50px rgba(27,108,158,0.14)" },
      fontFamily: {
        serifThai: ["Google Sans", "Google Sans Text", "Noto Sans Thai", "Arial", "sans-serif"],
        sansThai: ["Google Sans", "Google Sans Text", "Noto Sans Thai", "Arial", "sans-serif"],
        mono: ["Google Sans", "Google Sans Text", "Noto Sans Thai", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
