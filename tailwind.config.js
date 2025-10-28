/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5", // indigo-600
        accent:  "#22D3EE", // cyan-400
        ink:     "#0F172A", // slate-900
      },
    },
  },
  darkMode: "class",
  plugins: [],
};
