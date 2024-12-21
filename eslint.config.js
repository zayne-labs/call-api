import { zayne } from "@zayne-labs/eslint-config";

export default zayne({
	ignores: ["dist/**", "docs/.source/**"],
	react: {
		files: ["docs/**"],
		nextjs: true,
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
