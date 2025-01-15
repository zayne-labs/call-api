import { transformerTwoslash } from "@/lib/utils/twoSlash";
import { rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins";
import { remarkInstall } from "fumadocs-docgen";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";

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
