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
			transformers: [...(rehypeCodeDefaultOptions.transformers ?? []), transformerTwoslash()],
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
