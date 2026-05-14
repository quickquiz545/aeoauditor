import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#102018",
        muted: "#5f6f66",
        line: "#dbe7df",
        accent: {
          50: "#ecfdf3",
          100: "#d1fae5",
          500: "#16a34a",
          600: "#15803d",
          700: "#166534"
        }
      },
      boxShadow: {
        panel: "0 1px 2px rgba(16, 32, 24, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
