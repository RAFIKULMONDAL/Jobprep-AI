/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0B0D",
        surface: "#151518",
        surfaceHover: "#1C1C21",
        line: "#2A2A30",
        ink2: "#F2F2F0",
        muted: "#9A9AA5",
        accent: "#E8B339",
        accentHover: "#F2C563",
        success: "#34D399",
        danger: "#F87171",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
