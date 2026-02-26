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
                primary: "#6C63FF",
                secondary: "#FF6B9D",
                accent: "#00D9A5",
                danger: "#FF6B6B",
                warning: "#FFB347",
                bg: "#F8F9FE",
            },
            backgroundImage: {
                "brand-gradient": "linear-gradient(135deg, #6C63FF, #FF6B9D)",
            },
        },
    },
    plugins: [],
};

export default config;
