/** Paleta inspirada en Creative Boom: crema, negro puro y acentos saturados (amarillo, coral, rosa, aguamarina, verde). */
export default {
  // En táctil, :hover se queda «pegado» tras tocar: solo se aplica con ratón.
  future: { hoverOnlyWhenSupported: true },
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Creative Boom: crema, blanco y negro puro, gris editorial y cinco acentos saturados.
        ground: { DEFAULT: "#fbf7ef", 2: "#f1ebdf" },
        card: "#ffffff",
        line: { DEFAULT: "#e6dfd1", strong: "#9a958c" },
        ink: { DEFAULT: "#000000", soft: "#5f5f5f" },
        navy: "#1a1a1a",
        sun: "#ed91fa",
        lilac: "#b4dcdc",
        peach: "#ffc828",
        mint: "#05aa82",
        sky: "#ff614c",
        mist: "#e3f1f1",
        plum: "#c2361f",
        olive: "#03765a",
        pink: { DEFAULT: "#ed91fa", soft: "#f8d8fd" },
        moss: "#05aa82",
        slate: "#b4dcdc",
        forest: "#1a1a1a",
        rust: "#ff6432",
        taupe: "#9a958c",
      },
      fontFamily: {
        display: ['"Space Grotesk Variable"', "system-ui", "sans-serif"],
        brand: ['"Space Grotesk Variable"', "system-ui", "sans-serif"],
        serif: ['"Geist Variable"', "system-ui", "sans-serif"],
        sans: ['"Geist Variable"', "system-ui", "-apple-system", "Roboto", "sans-serif"],
        mono: ['"Geist Variable"', "system-ui", "sans-serif"],
      },
      borderRadius: { folder: "16px" },
      transitionTimingFunction: {
        out: "cubic-bezier(0.23, 1, 0.32, 1)",
        "in-out": "cubic-bezier(0.77, 0, 0.175, 1)",
        drawer: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
    },
  },
  plugins: [],
};
