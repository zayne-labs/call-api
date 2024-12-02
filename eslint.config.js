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
	type: "lib",
	typescript: {
		tsconfigPath: [
			"packages/**/tsconfig.json",
			"docs-beta/tsconfig.json",
			"docs/tsconfig.json",
			"**/tsconfig.json",
		],
	},
});
