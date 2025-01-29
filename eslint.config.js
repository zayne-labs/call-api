import { zayne } from "@zayne-labs/eslint-config";

export default zayne({
	ignores: ["dist/**", "apps/docs/.source/**"],
	react: {
		compiler: true,
		files: ["apps/docs/**"],
		nextjs: true,
		overrides: {
			"nextjs-next/no-html-link-for-pages": ["error", "apps/docs"],
		},
	},
	tailwindcss: {
		settings: {
			config: "apps/docs/tailwind.config.ts",
		},
	},
	type: "lib",
	typescript: {
		tsconfigPath: ["**/tsconfig.json"],
	},
});
