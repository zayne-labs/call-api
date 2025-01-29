import { defaultTwoslashOptions } from "@shikijs/twoslash";
import { rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins";
import { remarkInstall } from "fumadocs-docgen";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { transformerTwoslash } from "fumadocs-twoslash";

export const { docs, meta } = defineDocs({
	dir: "content/docs",
});

export default defineConfig({
	mdxOptions: {
		rehypeCodeOptions: {
			transformers: [
				...(rehypeCodeDefaultOptions.transformers ?? []),
				transformerTwoslash({
					twoslashOptions: {
						// == Adding default twoslash options from shiki cuz it contains the support for custom annotation tags like `@annotate`.
						...defaultTwoslashOptions(),
						compilerOptions: {
							noErrorTruncation: true,
						},
					},
				}),
			],
		},

		remarkPlugins: [
			[
				remarkInstall,
				{
					persist: {
						id: "persist-install",
					},
				},
			],
		],
	},
});
