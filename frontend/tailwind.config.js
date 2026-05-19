/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: {
          50: "#EAF3DE",
          100: "#C0DD97",
          400: "#639922",
          600: "#3B6D11",
          900: "#173404",
        },
        ball: {
          50: "#FAECE7",
          400: "#D85A30",
          600: "#993C1D",
          900: "#4A1B0C",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
