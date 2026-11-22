import type { Config } from "tailwindcss";

// package.json が "type": "module" のため、CommonJS（module.exports）では
// 開発サーバーが設定を読み込めなかった（#213）。
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
