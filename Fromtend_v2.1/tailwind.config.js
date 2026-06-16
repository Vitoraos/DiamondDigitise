const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#0A0F1E",
        depth: "#0F1E3A",
        surface: "#111827",
        gold: "#C9A84C",
        "gold-dim": "rgba(201,168,76,0.15)",
        white: "#F5F3EE",
        dim: "rgba(245,243,238,0.5)",
        ghost: "rgba(245,243,238,0.08)",
        error: "#E05252",
        success: "#4CAF50",
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", ...fontFamily.sans],
      },
      borderRadius: {
        none: "0",
        DEFAULT: "0",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
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
        shimmer: "shimmer 2s infinite linear",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
