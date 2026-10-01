/** Paleta inspirada en Pelago: crema, tinta, cinco pasteles y dos tonos hondos. */
export default {
  // En táctil, :hover se queda «pegado» tras tocar: solo se aplica con ratón.
  future: { hoverOnlyWhenSupported: true },
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ground: { DEFAULT: "#f6f1e9", 2: "#ece4d7" },
        card: "#fffcf7",
        line: { DEFAULT: "#e4dbcc", strong: "#b3a892" },
        ink: { DEFAULT: "#1e1e1c", soft: "#5e5850" },
        navy: "#2b4a39",
        sun: "#ff8ac8",
        lilac: "#a9bccf",
        peach: "#f2b48c",
        mint: "#c3ca85",
        sky: "#8da4ba",
        mist: "#dfe6ec",
        plum: "#a9521f",
        olive: "#5f6b25",
        // Paleta de personajes (Marshmallow)
        pink: { DEFAULT: "#ff8ac8", soft: "#ffd0e9" },
        moss: "#848f3e",
        slate: "#8da4ba",
        forest: "#2b4a39",
        rust: "#c4692c",
        taupe: "#a39780",
      },
      fontFamily: {
        display: ['"Figtree Variable"', "system-ui", "sans-serif"],
        brand: ['"Figtree Variable"', "system-ui", "sans-serif"],
        serif: ['"Figtree Variable"', "system-ui", "sans-serif"],
        sans: ['"Figtree Variable"', "system-ui", "-apple-system", "Roboto", "sans-serif"],
        mono: ['"Figtree Variable"', "system-ui", "sans-serif"],
      },
      borderRadius: { folder: "26px" },
      transitionTimingFunction: {
        out: "cubic-bezier(0.23, 1, 0.32, 1)",
        "in-out": "cubic-bezier(0.77, 0, 0.175, 1)",
        drawer: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
    },
  },
  plugins: [],
};
