import { defineConfig } from "tsup";

export default defineConfig((options) => ({
	format: ["esm", "cjs"],
	entry: ["src/**/*.ts", "!src/types.ts"],
	target: "node18",
	clean: true, // clean up dist folder,
	skipNodeModulesBundle: true, // skip building deps for node_modules, simply use them as is
	dts: true,
	minify: !options.watch,
	bundle: false,
	treeshake: true,
	sourcemap: !options.watch,
}));
