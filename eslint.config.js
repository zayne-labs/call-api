import { zayne } from "@zayne-labs/eslint-config";

export default zayne({
	ignores: ["dist/**"],
	react: {
		files: ["docs/**/*.tsx", "docs/**/*.ts"],
		nextjs: true,
		overrides: {
			"nextjs-next/no-html-link-for-pages": ["error", "docs"],
		},
	},
	type: "lib",
	typescript: {
		tsconfigPath: ["**/tsconfig.json"],
	},
});
