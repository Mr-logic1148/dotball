/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Premium dark palette inspired by Linear/Apple
        ink: {
          950: "#0A0A0B", // page bg
          900: "#111113", // card bg
          800: "#1A1A1D", // elevated surface
          700: "#26262B", // border
          600: "#3A3A40", // strong border
          500: "#5C5C66", // muted text
          400: "#8B8B95", // secondary text
          300: "#B4B4BD", // body text
          200: "#D6D6DD", // emphasis text
          100: "#F0F0F3", // headings
          50: "#FAFAFB", // pure white-ish
        },
        accent: {
          DEFAULT: "#FF4D2E", // ball red — the brand accent
          glow: "#FF6B4E",
        },
        success: "#3DD68C",
        danger: "#FF5060",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
