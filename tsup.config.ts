import { type Options, defineConfig } from "tsup";

export default defineConfig((options) => {
	const isProd = !options.watch;

	const commonOptions = {
		clean: true, // clean up dist folder,
		dts: true,
		minify: isProd ? "terser" : false,
		tsconfig: "tsconfig.json",
		sourcemap: isProd,
	} satisfies Options;

	return [
		{
			...commonOptions,
			format: ["esm"],
			entry: ["src/index.ts", "src/createFetchClient.ts", "src/utils.ts", "src/typeof.ts"],
			target: "esnext",
			platform: "browser",
			outDir: "./dist/esm",
			// bundle: false,
			skipNodeModulesBundle: true, // skip building deps for node_modules, simply use them as is
			splitting: true,
			treeshake: true,
		},
		{
			...commonOptions,
			entry: ["src/index.ts"],
			format: ["cjs"],
			platform: "neutral",
			outDir: "./dist/cjs",
		},
	];
});
