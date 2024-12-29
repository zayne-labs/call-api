/* eslint-disable perfectionist/sort-objects -- Ignore sort here */
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
	presets: [createPreset({ addGlobalColors: true })],

	theme: {
		extend: {
			fontFamily: {
				sans: ["var(--font-geist-sans)"],
				mono: ["var(--font-geist-mono)"],
			},

			colors: {
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				input: "hsl(var(--input))",
				border: "hsl(var(--border))",
				ring: "hsl(var(--ring))",
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
