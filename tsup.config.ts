import { type Options, defineConfig } from "tsup";

export default defineConfig((options) => {
	const isProduction = !options.watch;

	const commonOptions = {
		clean: true, // clean up dist folder,
		dts: true,
		minify: isProduction ? "terser" : false,
		name: "",
		sourcemap: isProduction,
		tsconfig: "tsconfig.json",
	} satisfies Options;

	return [
		{
			...commonOptions,
			entry: ["src/index.ts", "src/utils/index.ts"],
			format: ["esm"],
			outDir: "./dist/esm",
			platform: "browser",
			// bundle: false,
			skipNodeModulesBundle: true, // skip building deps for node_modules, simply use them as is
			splitting: true,
			target: "esnext",
			treeshake: true,
		},
		{
			...commonOptions,
			entry: ["src/index.ts", "src/utils/index.ts"],
			format: ["cjs"],
			outDir: "./dist/cjs",
			platform: "node",
		},
	];
});
