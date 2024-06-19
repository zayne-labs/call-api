import { defineConfig } from "tsup";

export default defineConfig((options) => ({
	format: ["esm", "cjs"],
	entry: ["src/index.ts", "src/utils.ts", "src/createFetchClient.ts"],
	target: "es2022",
	clean: true, // clean up dist folder,
	skipNodeModulesBundle: true, // skip building deps for node_modules, simply use them as is
	dts: true,
	splitting: false,
	minify: !options.watch,
	bundle: false,
	treeshake: true,
	tsconfig: "tsconfig.json",
	sourcemap: !options.watch,
}));
