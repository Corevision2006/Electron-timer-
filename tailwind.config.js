/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'Share Tech Mono'", "monospace"],
        display: ["'Bebas Neue'", "cursive"],
        body: ["'DM Sans'", "sans-serif"],
      },
      colors: {
        brand: {
          red: "#FF2D2D",
          dark: "#0A0A0A",
          panel: "#111111",
          border: "#222222",
          muted: "#444444",
          text: "#CCCCCC",
        },
      },
      animation: {
        "pulse-red": "pulseRed 0.8s ease-in-out infinite",
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.4s ease-out",
      },
      keyframes: {
        pulseRed: {
          "0%, 100%": { backgroundColor: "rgba(255,45,45,0.15)" },
          "50%": { backgroundColor: "rgba(255,45,45,0.45)" },
        },
        slideUp: {
          from: { transform: "translateY(20px)", opacity: 0 },
          to: { transform: "translateY(0)", opacity: 1 },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
