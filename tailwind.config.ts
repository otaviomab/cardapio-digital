import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        krato: {
          50: '#fff4ed',
          100: '#ffe6d5',
          200: '#ffc8ab',
          300: '#ffa175',
          400: '#ff7a3d',
          500: '#FE5F02', // Cor principal da Krato
          600: '#ea4a00',
          700: '#c23a00',
          800: '#9b2f02',
          900: '#7d2705',
        }
      },
    },
  },
  plugins: [],
} satisfies Config;
