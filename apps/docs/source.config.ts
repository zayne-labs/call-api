import { defaultTwoslashOptions } from "@shikijs/twoslash";
import { rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins";
import { remarkInstall } from "fumadocs-docgen";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { transformerTwoslash } from "fumadocs-twoslash";
import { remarkAutoTypeTable } from "fumadocs-typescript";

export const { docs, meta } = defineDocs({
	dir: "content/docs",
});

export default defineConfig({
	mdxOptions: {
		rehypeCodeOptions: {
			themes: {
				dark: "github-dark",
				light: "github-light",
			},

			transformers: [
				...(rehypeCodeDefaultOptions.transformers ?? []),

				transformerTwoslash({
					twoslashOptions: {
						// == Adding default twoslash options from shiki cuz it contains the support for custom annotation tags like `@annotate`.
						...defaultTwoslashOptions(),
						compilerOptions: {
							...defaultTwoslashOptions().compilerOptions,
							noErrorTruncation: true,
						},
					},
				}),
			],
		},

		remarkPlugins: [[remarkInstall, { persist: { id: "persist-install" } }], remarkAutoTypeTable],
	},
});
