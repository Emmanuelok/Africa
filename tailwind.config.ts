import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // African-inspired palette
        terracotta: {
          50: "#fdf5f1",
          100: "#fae5d9",
          200: "#f4c4ad",
          300: "#eb9b78",
          400: "#e07248",
          500: "#d4552a",
          600: "#b8401f",
          700: "#92301c",
          800: "#76281d",
          900: "#60241b",
          950: "#33110b"
        },
        savanna: {
          50: "#f5f7ee",
          100: "#e8edd5",
          200: "#d2dcae",
          300: "#b3c57f",
          400: "#94ac57",
          500: "#76913a",
          600: "#5a722a",
          700: "#465824",
          800: "#3a4821",
          900: "#323d20",
          950: "#19210d"
        },
        sand: {
          50: "#fbf8f1",
          100: "#f3ebd6",
          200: "#e6d5ad",
          300: "#d5b87b",
          400: "#c69a55",
          500: "#bb8540",
          600: "#a16d34",
          700: "#82532d",
          800: "#6c452a",
          900: "#5b3b27",
          950: "#341f13"
        },
        ink: {
          50: "#f6f6f5",
          100: "#e7e7e5",
          200: "#d1d1cd",
          300: "#aeaea7",
          400: "#85847c",
          500: "#6a6962",
          600: "#555550",
          700: "#464642",
          800: "#3c3c39",
          900: "#1f1f1d",
          950: "#0f0f0e"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"]
      },
      animation: {
        "ticker": "ticker 60s linear infinite",
        "fade-in": "fadeIn 0.6s ease-out",
        "fade-up": "fadeUp 0.6s ease-out"
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" }
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
