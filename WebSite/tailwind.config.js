/** @type {import('tailwindcss').Config} */
const { fontFamily } = require("tailwindcss/defaultTheme"); // Import defaultTheme

module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // In case you use /src directory structure
    "./styles/globals.css",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      backgroundImage: {
        gradient:
          "linear-gradient(60deg, #0F0F0F, #1F1F1F, #2F2F2F, #374151, #4B5563)",
      },
      animation: {
        opacity: "opacity 0.25s ease-in-out",
        appearFromRight: "appearFromRight 300ms ease-in-out",
        wiggle: "wiggle 1.5s ease-in-out infinite",
        popup: "popup 0.25s ease-in-out",
        shimmer: "shimmer 3s ease-out infinite alternate",
      },
      keyframes: {
        opacity: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        appearFromRight: {
          "0%": { opacity: 0.3, transform: "translate(15%, 0px);" },
          "100%": { opacity: 1, transform: "translate(0);" },
        },
        wiggle: {
          "0%, 20%, 80%, 100%": {
            transform: "rotate(0deg)",
          },
          "30%, 60%": {
            transform: "rotate(-2deg)",
          },
          "40%, 70%": {
            transform: "rotate(2deg)",
          },
          "45%": {
            transform: "rotate(-4deg)",
          },
          "55%": {
            transform: "rotate(4deg)",
          },
        },
        popup: {
          "0%": { transform: "scale(0.8)", opacity: 0.8 },
          "50%": { transform: "scale(1.1)", opacity: 1 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        shimmer: {
          "0%": { backgroundPosition: "0 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans], // Inter comme police par défaut
        serif: ["var(--font-playfair)", ...fontFamily.serif], // Playfair Display pour les titres
        grotesk: ["var(--font-grotesk)", ...fontFamily.sans], // Space Grotesk pour les sous-titres
        poppins: ["var(--font-poppins)", ...fontFamily.sans], // Poppins disponible
        lato: ["var(--font-lato)", ...fontFamily.sans], // Lato disponible
      },
      colors: {
        border: "hsl(var(--border))",
        primary: {
          100: "#0F0F0F", // Couleur primaire
          900: "#F5F5F5", // Fond alternatif
        },
        bg: {
          classic: "#FFFFFF", // Fond principal
          bouton: {
            classic: "#0F0F0F", // Primaire
            hover: "#374151", // Secondaire
            secondary: "#F5F5F5", // Fond alternatif
            secondaryHover: "#E5E5E5", // Version plus sombre du fond alternatif
          },
          top: {
            from: "#0F0F0F", // Primaire
            to: "#374151", // Secondaire
          },
          buble: "rgb(255 255 255 / 0.8)",
          automationShowcaseBuble: "#F5F5F5", // Fond alternatif
          videoShowcase: "#0F0F0F", // Primaire
          stars: "#374151", // Secondaire
        },
        border: {
          image: "rgb(55 65 81 / 0.5)", // Secondaire avec opacité
        },
        texte: {
          header: {
            black: "#000000", // Texte
            green: "#0F0F0F", // Primaire
            mobileBlack: "#374151", // Secondaire
          },
          description: {
            black: "#374151", // Secondaire
            green: "#0F0F0F", // Primaire
          },
          footer: "#374151", // Secondaire
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
