import { type Options, defineConfig } from "tsup";

export default defineConfig((options) => {
	const commonOptions = {
		clean: true, // clean up dist folder,
		dts: true,
		minify: !options.watch,
		tsconfig: "tsconfig.json",
		sourcemap: !options.watch,
	} satisfies Options;

	return [
		{
			...commonOptions,
			format: ["esm"],
			entry: ["src/index.ts", "src/createFetchClient.ts", "src/utils.ts", "src/typeof.ts"],
			target: "esnext",
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
			outDir: "./dist/cjs",
		},
	];
});
