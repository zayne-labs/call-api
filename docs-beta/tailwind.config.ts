/* eslint-disable perfectionist/sort-objects */
import { createPreset } from "fumadocs-ui/tailwind-plugin";
import type { Config } from "tailwindcss";

const config = {
	content: [
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./content/**/*.{md,mdx}",
		"./mdx-components.{ts,tsx}",
		"./node_modules/fumadocs-ui/dist/**/*.js",
	],
	presets: [createPreset({ preset: "dusk" })],

	theme: {
		colors: {
			background: "hsl(0, 0%, 100%)",
			foreground: "hsl(222.2, 47.4%, 11.2%)",
			primary: {
				DEFAULT: "hsl(222.2, 47.4%, 11.2%)",
				foreground: "hsl(210, 40%, 98%)",
			},
			secondary: {
				DEFAULT: "hsl(210, 40%, 96.1%)",
				foreground: "hsl(222.2, 47.4%, 11.2%)",
			},
			popover: {
				DEFAULT: "hsl(0, 0%, 100%)",
				foreground: "hsl(222.2, 47.4%, 11.2%)",
			},
			accent: {
				DEFAULT: "hsl(210, 40%, 96.1%)",
				foreground: "hsl(222.2, 47.4%, 11.2%)",
			},
			muted: {
				DEFAULT: "hsl(210, 40%, 96.1%)",
				foreground: "hsl(215.4, 16.3%, 46.9%)",
			},
			input: "hsl(214.3, 31.8%, 91.4%)",
			border: "hsl(214.3, 31.8%, 91.4%)",
			ring: "hsl(215, 20.2%, 65.1%)",
		},
	},
} satisfies Config;

export default config;
