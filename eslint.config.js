import { zayne } from "@zayne-labs/eslint-config";

export default zayne({
	ignores: ["dist/**", "docs/.source/**"],
	react: {
		files: ["docs/**", "docs-old/**"],
		nextjs: true,
		overrides: {
			"nextjs-next/no-html-link-for-pages": ["error", "docs-old"],
		},
	},
	tailwindcss: {
		settings: {
			config: "docs/tailwind.config.ts",
		},
	},
	type: "lib",
	typescript: {
		tsconfigPath: ["**/tsconfig.json"],
	},
});
