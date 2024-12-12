import { zayne } from "@zayne-labs/eslint-config";

export default zayne({
	ignores: ["dist/**", "docs-beta/.source/**"],
	react: {
		files: ["docs/**", "docs-beta/**"],
		nextjs: true,
		overrides: {
			"nextjs-next/no-html-link-for-pages": ["error", "docs"],
		},
	},
	tailwindcss: {
		settings: {
			config: "docs-beta/tailwind.config.ts",
		},
	},
	type: "lib",
	typescript: {
		tsconfigPath: ["**/tsconfig.json"],
	},
});
