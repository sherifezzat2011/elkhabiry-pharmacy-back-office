import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#F0FBFA",
          100: "#DDF7F6",
          200: "#B5ECEA",
          300: "#7FDDDA",
          400: "#42C9C5",
          500: "#10B7B4",
          600: "#078E8D",
          700: "#086F70",
          800: "#07595A",
          900: "#064849",
          950: "#043334",
        },
      },
      boxShadow: {
        soft: "0 14px 34px rgba(50, 56, 61, 0.08)",
        glow: "0 14px 34px rgba(16, 183, 180, 0.18)",
      },
    },
  },
  plugins: [],
} satisfies Config;
