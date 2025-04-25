import { zayne } from "@zayne-labs/eslint-config";

export default zayne({
	ignores: ["packages/**/dist/**", "apps/docs/.source/**"],
	react: {
		// compiler: true,
		files: ["apps/docs/**/*.{ts,tsx}"],
		nextjs: true,
		overrides: {
			"nextjs-next/no-html-link-for-pages": ["error", "apps/docs"],
		},
	},
	type: "lib",
	typescript: {
		tsconfigPath: ["**/tsconfig.json"],
	},
});
