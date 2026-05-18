/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#251813",
        umber: "#5f432f",
        vellum: "#f3e7ce",
        parchment: "#ead7ad",
        brass: "#a36d24",
        oxblood: "#8c1f24",
        laurel: "#2f614f",
        slate: "#344752"
      },
      boxShadow: {
        sheet: "0 18px 55px rgba(31, 20, 12, 0.22)",
        insetLine: "inset 0 0 0 1px rgba(80, 48, 24, 0.18)"
      },
      fontFamily: {
        display: ["Georgia", "Times New Roman", "serif"],
        ui: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
