/* eslint-disable perfectionist/sort-objects -- Ignore sort here */
import type { Config } from "tailwindcss";

const config = {
	content: [
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./content/**/*.{md,mdx}",
		"./node_modules/fumadocs-ui/dist/**/*.js",
	],

	theme: {
		extend: {
			fontFamily: {
				sans: ["var(--font-geist-sans)"],
				mono: ["var(--font-geist-mono)"],
			},

			backgroundImage: {
				"gradient-radial": "radial-gradient(circle, var(--tw-gradient-stops))",
				"repeat-gradient-to-r": "repeating-linear-gradient(to right, var(--tw-gradient-stops))",
				"repeat-gradient-to-br":
					"repeating-linear-gradient(to bottom right, var(--tw-gradient-stops))",
			},

			animation: {
				ripple: "ripple var(--duration,2s) ease calc(var(--i, 0)*.2s) infinite",
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},

			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
				ripple: {
					"0%, 100%": {
						transform: "translate(-50%, -50%) scale(1)",
					},
					"50%": {
						transform: "translate(-50%, -50%) scale(0.9)",
					},
				},
			},
		},
	},
} satisfies Config;

export default config;
