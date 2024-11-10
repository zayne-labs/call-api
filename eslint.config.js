import zayne from "@zayne-labs/eslint-config";

export default zayne({
	type: "lib",
	ignores: ["dist/**", "eslint.config.js"],
	typescript: {
		tsconfigPath: [
			"dev/tsconfig.json",
			"packages/callapi/tsconfig.json",
			"packages/callapi-legacy/tsconfig.json",
			"docs/tsconfig.json",
		],
	},
});
