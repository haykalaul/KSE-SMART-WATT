/** @type {import('tailwindcss').Config} */
import tailwindcssAnimate from "tailwindcss-animate";
import flowbite from "flowbite-react/tailwind";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}", flowbite.content()],
  theme: {
    extend: {
      boxShadow: {
        "medium": "0 0 10px 0 rgba(0, 0, 0, 0.1)",
        "strong": "0 0 30px 0 rgba(0, 0, 0, 0.3)",
        'inner-medium': 'inset 0 0 10px 0 rgba(0, 0, 0, 0.3)',
        'inner-strong': 'inset 0 0 30px 0 rgba(0, 0, 0, 0.5)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        tealBright: "#00BCCF",
        darkGreenish: "#142F34",
        lightGray: "#E8F1F2",
        gradientStart: "#1E3C5A",
        gradientEnd: "#0A1432",
      },
      fontFamily: {
        inter: ["Inter"],
        poppins: ["Poppins"],
      },
      animation: {
        first: "moveVertical 30s ease infinite",
        second: "moveInCircle 20s reverse infinite",
        third: "moveInCircle 40s linear infinite",
        fourth: "moveHorizontal 40s ease infinite",
        fifth: "moveInCircle 20s ease infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        moveHorizontal: {
          "0%": {
            transform: "translateX(-50%) translateY(-10%)",
          },
          "50%": {
            transform: "translateX(50%) translateY(10%)",
          },
          "100%": {
            transform: "translateX(-50%) translateY(-10%)",
          },
        },
        moveInCircle: {
          "0%": {
            transform: "rotate(0deg)",
          },
          "50%": {
            transform: "rotate(180deg)",
          },
          "100%": {
            transform: "rotate(360deg)",
          },
        },
        moveVertical: {
          "0%": {
            transform: "translateY(-50%)",
          },
          "50%": {
            transform: "translateY(50%)",
          },
          "100%": {
            transform: "translateY(-50%)",
          },
        },
        shimmer: {
          from: {
            backgroundPosition: "0 0",
          },
          to: {
            backgroundPosition: "-200% 0",
          },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.25, 1, 0.5, 1)', // Smooth & responsive
        'ease-in-out-back': 'cubic-bezier(0.68, -0.55, 0.27, 1.55)', // Bounce-like effect
        'ease-in-out-smooth': 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Default ease-in-out, but smooth
      },
    },
  },
  plugins: [tailwindcssAnimate, flowbite.plugin()],
};
