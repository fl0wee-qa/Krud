import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f4f6f8",
        slate: "#182028",
        pine: "#1f5f5b",
        mint: "#8de0c0",
        ember: "#ff774d"
      },
      boxShadow: {
        soft: "0 10px 30px -16px rgba(24, 32, 40, 0.45)"
      }
    }
  },
  plugins: []
};

export default config;
