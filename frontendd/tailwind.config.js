const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f0f2f5",
          100: "#d9e0e8",
          200: "#b3c1ce",
          300: "#8c9fb3",
          400: "#667c99",
          500: "#4d5f80",
          600: "#3a4a66",
          700: "#2d3a52",
          800: "#1f2a3d",
          900: "#141c2b",
        },
        beige: {
          50: "#fdfbf7",
          100: "#f9f3e5",
          200: "#f2e4c9",
          300: "#e9d3a8",
          400: "#dec087",
          500: "#d2ad6e",
          600: "#c49a55",
          700: "#b58545",
          800: "#9e703c",
          900: "#7f5a32",
        },
        gold: {
          50: "#fffbe6",
          100: "#fff3cc",
          200: "#ffe999",
          300: "#ffde66",
          400: "#ffd333",
          500: "#e6b800",
          600: "#b38f00",
          700: "#806600",
          800: "#4d3d00",
          900: "#1a1400",
        },
      },
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans],
        serif: ["Playfair Display", ...fontFamily.serif],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};