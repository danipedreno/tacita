/** Paleta inspirada en Pelago: crema, tinta, cinco pasteles y dos tonos hondos. */
export default {
  // En táctil, :hover se queda «pegado» tras tocar: solo se aplica con ratón.
  future: { hoverOnlyWhenSupported: true },
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ground: { DEFAULT: "#fdf4df", 2: "#f5e8c8" },
        card: "#ffffff",
        line: { DEFAULT: "#ebdfc3", strong: "#b8ab8e" },
        ink: { DEFAULT: "#222222", soft: "#5d5847" },
        navy: "#212633",
        sun: "#fae355",
        lilac: "#e6befb",
        peach: "#f6d5c2",
        mint: "#e1f1c8",
        sky: "#a4bdff",
        mist: "#e9eefe",
        plum: "#6b2346",
        olive: "#4a6a1b",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', "system-ui", "sans-serif"],
        brand: ["Caprasimo", "Georgia", "serif"],
        serif: ['"Source Serif 4 Variable"', "Georgia", "serif"],
        sans: ['"Bricolage Grotesque Variable"', "system-ui", "-apple-system", "Roboto", "sans-serif"],
        mono: ['"Bricolage Grotesque Variable"', "system-ui", "sans-serif"],
      },
      borderRadius: { folder: "18px" },
      transitionTimingFunction: {
        out: "cubic-bezier(0.23, 1, 0.32, 1)",
        "in-out": "cubic-bezier(0.77, 0, 0.175, 1)",
        drawer: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
    },
  },
  plugins: [],
};
