import type { MetadataRoute } from "next";
import { baseURL } from "@/lib/metadata";
import { source } from "@/lib/source";

export const revalidate = false;

const sitemap = (): MetadataRoute.Sitemap => {
	const pages = source.getPages().map((page) => ({ slug: page.slugs }));

	const docs = pages.map((page) => ({
		lastModified: new Date().toISOString().split("T")[0],
		url: `${baseURL}/docs/${page.slug.join("/")}`,
	}));

	return [
		{
			lastModified: new Date().toISOString().split("T")[0],
			url: baseURL,
		},
		...docs,
	];
};

export default sitemap;
