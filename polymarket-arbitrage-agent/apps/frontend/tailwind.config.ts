import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cyberpunk theme matching terminal UI
        bg: {
          primary: "#050505",
          secondary: "rgba(0,0,0,0.45)",
          card: "rgba(0,0,0,0.35)",
        },
        border: {
          primary: "rgba(120,180,255,0.22)",
          secondary: "rgba(120,180,255,0.18)",
        },
        text: {
          primary: "rgba(190,220,255,0.92)",
          secondary: "rgba(210,230,255,0.85)",
          dim: "rgba(190,220,255,0.55)",
        },
        accent: {
          green: "#35d07f",
          red: "#ff5c6c",
          yellow: "#ffcf66",
          blue: "#9ad0ff",
          cyan: "#b7ffea",
        },
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;

