import type { Config } from "tailwindcss";

export default {
	content: [
		"./pages/**/*.{js,jsx,ts,tsx,md,mdx}",
		"./components/**/*.{js,jsx,ts,tsx,md,mdx}",
		"./theme.config.tsx",
	],
	plugins: [],
	theme: {
		extend: {},
	},
} satisfies Config;
