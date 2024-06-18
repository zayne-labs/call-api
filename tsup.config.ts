import { defineConfig } from "tsup";

export default defineConfig((options) => ({
	format: ["esm"],
	target: "node18",
	/*LINK - Visit here to see how to configure for bundling files separately https://dorshinar.me/posts/treeshaking-with-tsup */
	entry: ["src/**/*.ts", "!src/types.ts"],
	clean: true, // clean up dist folder,
	skipNodeModulesBundle: true, // skip building deps for node_modules, simply use them as is
	dts: true, // Generate d.ts files
	minify: !options.watch,
	treeshake: true, // Remove unused code,
	sourcemap: !options.watch,
}));
